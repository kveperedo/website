import {
  addMonths,
  format,
  getDaysInMonth,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
} from "date-fns";

import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";
import type { ScheduledTransactionInput } from "@/schema/scheduled-transaction";

import { getDb } from "@/db/client";

import { databaseDateToDateOnly, dateOnlyToDatabaseDate } from "./date-only";
import { createTransaction } from "./transaction-creation.server";

const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    monthStart: startOfMonth(now),
    monthEnd: startOfMonth(addMonths(now, 1)),
  };
};

const getDayInMonth = (year: number, month: number, dayOfMonth: number) => {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const day = Math.min(dayOfMonth, daysInMonth);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const isOccurrenceWithinTemplateRange = (
  occurrence: Date,
  startDate: Date,
  endDate: Date | null,
) => {
  return !isBefore(occurrence, startDate) && (!endDate || !isAfter(occurrence, endDate));
};

const isUniqueConstraintError = (error: unknown) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
};

export const getScheduledTransactionTemplates = async () => {
  const templates = await getDb().scheduledTransactionTemplate.findMany({
    orderBy: [{ dayOfMonth: "asc" }, { isActive: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { transactions: true } },
    },
  });

  return templates.map((t) => ({
    ...t,
    amount: t.amount.toNumber(),
    endDate: t.endDate ? databaseDateToDateOnly(t.endDate) : null,
  }));
};

export const getUpcomingScheduledTransactionTemplates = async () => {
  const { monthStart, monthEnd } = getCurrentMonthRange();
  const now = new Date();
  const nextMonthEnd = startOfMonth(addMonths(now, 2));
  const monthStarts = [monthStart, monthEnd];

  const templates = await getDb().scheduledTransactionTemplate.findMany({
    where: {
      isActive: true,
      startDate: { lt: nextMonthEnd },
      OR: [{ endDate: null }, { endDate: { gte: monthStart } }],
    },
    include: {
      _count: { select: { transactions: true } },
      transactions: {
        where: {
          transactedAt: { gte: monthStart, lt: nextMonthEnd },
        },
        select: { transactedAt: true },
      },
    },
  });

  const upcomingTransactions = templates
    .flatMap((template) => {
      if (
        template.maxOccurrences !== null &&
        template._count.transactions >= template.maxOccurrences
      ) {
        return [];
      }

      for (const occurrenceMonthStart of monthStarts) {
        const occurrence = getDayInMonth(
          occurrenceMonthStart.getFullYear(),
          occurrenceMonthStart.getMonth() + 1,
          template.dayOfMonth,
        );
        const nextOccurrenceMonthStart = startOfMonth(addMonths(occurrenceMonthStart, 1));
        const isRecorded = template.transactions.some(
          (transaction) =>
            transaction.transactedAt >= occurrenceMonthStart &&
            transaction.transactedAt < nextOccurrenceMonthStart,
        );

        if (
          isAfter(occurrence, now) &&
          isOccurrenceWithinTemplateRange(occurrence, template.startDate, template.endDate) &&
          !isRecorded
        ) {
          return [{ occurrence, template }];
        }
      }

      return [];
    })
    .sort((a, b) => a.occurrence.getTime() - b.occurrence.getTime())
    .slice(0, 3);

  return [
    {
      label: format(monthStart, "MMMM"),
      transactions: upcomingTransactions.filter(({ occurrence }) => occurrence < monthEnd),
    },
    {
      label: format(monthEnd, "MMMM"),
      transactions: upcomingTransactions.filter(({ occurrence }) => occurrence >= monthEnd),
    },
  ]
    .filter((group) => group.transactions.length > 0)
    .map(({ label, transactions }) => ({
      label,
      transactions: transactions.map(({ template }) => {
        const { transactions: _transactions, ...templateData } = template;
        return { ...templateData, amount: template.amount.toNumber() };
      }),
    }));
};

export const createScheduledTransaction = async (
  data: Omit<TransactionInputType, "template">,
  schedule: ScheduledTransactionInput,
) => {
  const endDate = schedule.endDate ? dateOnlyToDatabaseDate(schedule.endDate) : undefined;
  let templateId: string | undefined;

  try {
    const template = await getDb().scheduledTransactionTemplate.create({
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category ?? undefined,
        dayOfMonth: schedule.dayOfMonth,
        startDate: data.transactedAt,
        endDate,
        maxOccurrences: schedule.maxOccurrences ?? undefined,
        isActive: true,
      },
    });
    templateId = template.id;

    return await createTransaction({ ...data, templateId });
  } catch (err) {
    if (templateId) {
      try {
        await deleteScheduledTransactionTemplate(templateId);
      } catch (cleanupErr) {
        console.error("Failed to remove unlinked scheduled transaction template:", cleanupErr);
      }
    }

    console.error(err);
    throw new Error("Failed to create scheduled transaction.");
  }
};

export const createScheduledTransactionTemplate = async (
  id: string,
  schedule: ScheduledTransactionInput,
) => {
  const endDate = schedule.endDate ? dateOnlyToDatabaseDate(schedule.endDate) : undefined;
  const transaction = await getDb().transaction.findUniqueOrThrow({
    where: { id },
  });
  if (transaction.templateId) {
    throw new Error("This transaction is already scheduled.");
  }
  if (schedule.endDate && schedule.endDate < transaction.transactedAt.toISOString().slice(0, 10)) {
    throw new Error("End date cannot be before the transaction date.");
  }

  let templateId: string | undefined;
  try {
    const template = await getDb().scheduledTransactionTemplate.create({
      data: {
        sourceTransactionId: id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category ?? undefined,
        dayOfMonth: schedule.dayOfMonth,
        startDate: transaction.transactedAt,
        endDate,
        maxOccurrences: schedule.maxOccurrences ?? undefined,
        isActive: true,
      },
    });
    templateId = template.id;

    const updatedTransaction = await getDb().transaction.update({
      where: { id },
      data: { templateId },
    });
    return { ...updatedTransaction, amount: updatedTransaction.amount.toNumber() };
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new Error("This transaction is already scheduled.");
    }

    if (templateId) {
      try {
        await deleteScheduledTransactionTemplate(templateId);
      } catch (cleanupErr) {
        console.error("Failed to remove unlinked scheduled transaction template:", cleanupErr);
      }
    }

    console.error(err);
    throw new Error("Failed to schedule transaction.");
  }
};

export const toggleScheduledTransactionTemplate = async (id: string) => {
  const current = await getDb().scheduledTransactionTemplate.findUniqueOrThrow({
    where: { id },
    select: { isActive: true },
  });
  const template = await getDb().scheduledTransactionTemplate.update({
    where: { id },
    data: {
      isActive: !current.isActive,
    },
  });

  return {
    ...template,
    amount: template.amount.toNumber(),
  };
};

export const deleteScheduledTransactionTemplate = async (id: string) => {
  await getDb().scheduledTransactionTemplate.delete({ where: { id } });
};

export const generateScheduledTransactions = async () => {
  const { monthStart, monthEnd } = getCurrentMonthRange();
  const now = new Date();
  const today = startOfDay(now);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const templates = await getDb().scheduledTransactionTemplate.findMany({
    where: {
      isActive: true,
      startDate: { lt: monthEnd },
    },
  });

  const created: Array<{ id: string; templateId: string; description: string }> = [];

  for (const template of templates) {
    const transactedAt = getDayInMonth(year, month, template.dayOfMonth);

    if (
      isAfter(transactedAt, today) ||
      !isOccurrenceWithinTemplateRange(transactedAt, template.startDate, template.endDate)
    ) {
      continue;
    }

    const [count, existing] = await Promise.all([
      getDb().transaction.count({ where: { templateId: template.id } }),
      getDb().transaction.findFirst({
        where: {
          templateId: template.id,
          transactedAt: { gte: monthStart, lt: monthEnd },
        },
      }),
    ]);

    if (template.maxOccurrences !== null && count >= template.maxOccurrences) {
      continue;
    }

    if (existing) {
      continue;
    }

    let transaction;
    try {
      transaction = await createTransaction({
        description: template.description,
        amount: template.amount.toNumber(),
        type: template.type,
        category: template.category,
        transactedAt,
        templateId: template.id,
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        continue;
      }

      throw err;
    }

    created.push({
      id: transaction.id,
      templateId: template.id,
      description: transaction.description,
    });
  }

  return { created };
};
