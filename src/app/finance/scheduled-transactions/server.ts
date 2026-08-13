import { addMonths, isAfter, isBefore } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";
import type { ScheduledTransactionInput } from "@/schema/scheduled-transaction";

import { getDb } from "@/db/client";

import {
  databaseDateToDateOnly,
  dateOnlyToDatabaseDate,
  getCurrentMonthRange,
  getCurrentYearMonth,
  startOfLocalMonth,
  TIME_ZONE,
} from "../local-date";
import { createTransaction } from "../transactions/creation.server";

const getDayInMonth = (year: number, month: number, dayOfMonth: number) => {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, daysInMonth);
  return new Date(Date.UTC(year, month - 1, day));
};

const startOfUtcDay = (date: Date) => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const isOccurrenceWithinTemplateRange = (
  occurrence: Date,
  startDate: Date,
  endDate: Date | null,
) => {
  return !isBefore(occurrence, startDate) && (!endDate || !isAfter(occurrence, endDate));
};

const getErrorCode = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  return typeof error.code === "string" ? error.code : undefined;
};

const isUniqueConstraintError = (error: unknown) => {
  return getErrorCode(error) === "P2002";
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
  const now = new Date();
  const { monthStart, monthEnd } = getCurrentMonthRange(now);
  const nextMonthEnd = getCurrentMonthRange(addMonths(now, 1)).monthEnd;
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
        const zoned = toZonedTime(occurrenceMonthStart, TIME_ZONE);
        const year = zoned.getFullYear();
        const month = zoned.getMonth() + 1;
        const occurrence = getDayInMonth(year, month, template.dayOfMonth);
        const nextOccurrenceMonthStart = startOfLocalMonth(year, month + 1);
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
      label: formatInTimeZone(monthStart, TIME_ZONE, "MMMM"),
      transactions: upcomingTransactions.filter(({ occurrence }) => occurrence < monthEnd),
    },
    {
      label: formatInTimeZone(monthEnd, TIME_ZONE, "MMMM"),
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

export const generateScheduledTransactions = async (date: Date) => {
  const { monthStart, monthEnd } = getCurrentMonthRange(date);
  const { year, month } = getCurrentYearMonth(date);
  const today = startOfUtcDay(date);

  const templates = await getDb().scheduledTransactionTemplate.findMany({
    where: {
      isActive: true,
      startDate: { lt: monthEnd },
    },
  });

  let failedCount = 0;

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

    try {
      await createTransaction({
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

      failedCount += 1;
      console.error("Failed to generate scheduled transaction.", {
        templateId: template.id,
        transactedAt: transactedAt.toISOString(),
        errorCode: getErrorCode(err),
      });
      continue;
    }
  }

  if (failedCount > 0) {
    throw new Error(`Failed to generate ${failedCount} scheduled transaction(s).`);
  }
};
