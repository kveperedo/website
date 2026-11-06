import { addMonths, isAfter, isBefore } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

import type {
  CreateStandaloneScheduledTemplateInput,
  ScheduledTransactionInput,
  UpdateScheduledTransactionInput,
} from "@/app/finance/scheduled/scheduled.schema";
import type { TransactionCategory } from "@/generated/prisma/enums";
import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";

import { withTransaction, type DbTransactionClient } from "@/app/infra/database/client.server";

import {
  databaseDateToDateOnly,
  dateOnlyToDatabaseDate,
  getCurrentMonthRange,
  getCurrentYearMonth,
  startOfLocalMonth,
  startOfNextLocalMonth,
  TIME_ZONE,
} from "../shared/local-date";
import {
  attachTemplateToTransaction,
  countTransactionsByTemplate,
  createTransaction,
  findTransactionByTemplateInRange,
  findTransactionForScheduling,
} from "../transactions/transactions.repository.server";
import {
  countArchivedTemplates,
  createTemplate,
  findActiveTemplatesStartedBefore,
  findArchivedTemplates,
  findExpenseTemplatesInMonth,
  findTemplateStatusForUpdate,
  findTemplateById,
  findTemplateForUpdate,
  findUpcomingTemplates,
  findActiveAndPausedTemplates,
  updateTemplateStatus,
  updateTemplate,
} from "./scheduled.repository.server";

const getDayInMonth = (year: number, month: number, dayOfMonth: number) => {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, daysInMonth);
  return new Date(Date.UTC(year, month - 1, day));
};

const isRecordedOn = (transactions: Array<{ transactedAt: Date }>, occurrenceDateOnly: string) => {
  return transactions.some(
    (transaction) => databaseDateToDateOnly(transaction.transactedAt) === occurrenceDateOnly,
  );
};

const hasReachedMaxOccurrences = (template: {
  maxOccurrences: number | null;
  _count: { transactions: number };
}) => {
  return (
    template.maxOccurrences !== null && template._count.transactions >= template.maxOccurrences
  );
};

const isFutureOccurrence = (occurrence: Date, nowDateOnly: string) => {
  return databaseDateToDateOnly(occurrence) > nowDateOnly;
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

const isForeignKeyConstraintError = (error: unknown) => {
  return getErrorCode(error) === "P2003";
};

const mapScheduledTemplate = <
  T extends { amount: { toNumber: () => number }; startDate: Date; endDate: Date | null },
>(
  template: T,
) => ({
  ...template,
  amount: template.amount.toNumber(),
  startDate: databaseDateToDateOnly(template.startDate),
  endDate: template.endDate ? databaseDateToDateOnly(template.endDate) : null,
});

export const getScheduledTransactionTemplates = async () => {
  const templates = await findActiveAndPausedTemplates();

  return templates.map(mapScheduledTemplate);
};

export const getArchivedScheduledTransactionTemplates = async () => {
  const templates = await findArchivedTemplates();

  return templates.map(mapScheduledTemplate);
};

export const getArchivedScheduledTransactionTemplatesCount = async () => {
  return await countArchivedTemplates();
};

export const getUpcomingScheduledTransactionTemplates = async () => {
  const now = new Date();
  const { monthStart, monthEnd } = getCurrentMonthRange(now);
  const nextMonthEnd = getCurrentMonthRange(addMonths(now, 1)).monthEnd;
  const monthStarts = [monthStart, monthEnd];

  const templates = await findUpcomingTemplates({ monthStart, rangeEnd: nextMonthEnd });

  const nowDateOnly = databaseDateToDateOnly(now);

  const upcomingTransactions = templates
    .flatMap((template) => {
      if (hasReachedMaxOccurrences(template)) {
        return [];
      }

      for (const occurrenceMonthStart of monthStarts) {
        const zoned = toZonedTime(occurrenceMonthStart, TIME_ZONE);
        const year = zoned.getFullYear();
        const month = zoned.getMonth() + 1;
        const occurrence = getDayInMonth(year, month, template.dayOfMonth);
        const occurrenceDateOnly = databaseDateToDateOnly(occurrence);

        if (
          isFutureOccurrence(occurrence, nowDateOnly) &&
          isOccurrenceWithinTemplateRange(occurrence, template.startDate, template.endDate) &&
          !isRecordedOn(template.transactions, occurrenceDateOnly)
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

export const getScheduledExpensesForCurrentMonth = async () => {
  const now = new Date();
  const { year, month } = getCurrentYearMonth(now);
  const monthStart = startOfLocalMonth(year, month);
  const nextMonthStart = startOfNextLocalMonth(year, month);
  const nowDateOnly = databaseDateToDateOnly(now);

  const templates = await findExpenseTemplatesInMonth({
    monthStart,
    monthEnd: nextMonthStart,
  });

  let scheduledExpenses = 0;
  let scheduledCount = 0;

  for (const template of templates) {
    if (hasReachedMaxOccurrences(template)) {
      continue;
    }
    const occurrence = getDayInMonth(year, month, template.dayOfMonth);
    const occurrenceDateOnly = databaseDateToDateOnly(occurrence);
    if (
      isFutureOccurrence(occurrence, nowDateOnly) &&
      isOccurrenceWithinTemplateRange(occurrence, template.startDate, template.endDate) &&
      !isRecordedOn(template.transactions, occurrenceDateOnly)
    ) {
      scheduledExpenses += template.amount.toNumber();
      scheduledCount += 1;
    }
  }

  return { scheduledExpenses, scheduledCount };
};

export const createScheduledTransaction = async (
  db: DbTransactionClient,
  data: Omit<TransactionInputType, "template">,
  schedule: ScheduledTransactionInput,
) => {
  const endDate = schedule.endDate ? dateOnlyToDatabaseDate(schedule.endDate) : undefined;

  try {
    const template = await createTemplate(db, {
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: (data.category as TransactionCategory) ?? undefined,
      dayOfMonth: schedule.dayOfMonth,
      startDate: data.transactedAt,
      endDate,
      maxOccurrences: schedule.maxOccurrences ?? undefined,
      status: "active",
    });
    return await createTransaction(db, { ...data, templateId: template.id });
  } catch (err) {
    console.error(err);
    throw new Error("Failed to create scheduled transaction.");
  }
};

export const createScheduledTransactionTemplate = async (
  id: string,
  schedule: ScheduledTransactionInput,
) => {
  const endDate = schedule.endDate ? dateOnlyToDatabaseDate(schedule.endDate) : undefined;

  try {
    return await withTransaction(async (db) => {
      const transaction = await findTransactionForScheduling(db, id);
      if (transaction.templateId) {
        throw new Error("This transaction is already scheduled.");
      }
      if (
        schedule.endDate &&
        schedule.endDate < transaction.transactedAt.toISOString().slice(0, 10)
      ) {
        throw new Error("End date cannot be before the transaction date.");
      }

      const template = await createTemplate(db, {
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category ?? undefined,
        dayOfMonth: schedule.dayOfMonth,
        startDate: transaction.transactedAt,
        endDate,
        maxOccurrences: schedule.maxOccurrences ?? undefined,
        status: "active",
      });
      const result = await attachTemplateToTransaction(db, id, template.id);
      if (result.count !== 1) {
        throw new Error("This transaction is already scheduled.");
      }
      const updatedTransaction = await findTransactionForScheduling(db, id);

      return { ...updatedTransaction, amount: updatedTransaction.amount.toNumber() };
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "This transaction is already scheduled." ||
        err.message === "End date cannot be before the transaction date.")
    ) {
      throw err;
    }

    console.error(err);
    throw new Error("Failed to schedule transaction.");
  }
};

export const toggleScheduledTransactionTemplate = async (id: string) => {
  const template = await withTransaction(async (db) => {
    const current = await findTemplateStatusForUpdate(db, id);
    if (current.status === "archived") {
      throw new Error("Archived schedules cannot be toggled.");
    }
    return await updateTemplateStatus(db, id, {
      status: current.status === "active" ? "paused" : "active",
    });
  });

  return {
    ...template,
    amount: template.amount.toNumber(),
  };
};

export const archiveScheduledTransactionTemplate = async (id: string) => {
  const template = await withTransaction(async (db) => {
    const current = await findTemplateForUpdate(db, id);
    if (!current) {
      throw new Error("Template not found");
    }
    if (current.status === "archived") {
      return current;
    }
    return await updateTemplateStatus(db, id, { status: "archived", archivedAt: new Date() });
  });

  return {
    ...template,
    amount: template.amount.toNumber(),
  };
};

export const getScheduledTransactionTemplateById = async (id: string) => {
  const template = await findTemplateById(id);

  if (!template) {
    throw new Error("Template not found");
  }

  return {
    ...template,
    amount: template.amount.toNumber(),
    startDate: databaseDateToDateOnly(template.startDate),
    endDate: template.endDate ? databaseDateToDateOnly(template.endDate) : null,
  };
};

export const updateScheduledTransactionTemplate = async (
  id: string,
  data: UpdateScheduledTransactionInput["data"],
) => {
  const template = await withTransaction(async (db) => {
    const existing = await findTemplateStatusForUpdate(db, id);
    if (existing.status === "archived") {
      throw new Error("Archived schedules cannot be edited.");
    }
    const startDate = dateOnlyToDatabaseDate(data.startDate);
    const endDate = data.endDate ? dateOnlyToDatabaseDate(data.endDate) : null;

    return await updateTemplate(db, id, {
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.type === "income" ? null : (data.category ?? null),
      startDate,
      dayOfMonth: data.dayOfMonth,
      endDate,
      maxOccurrences: data.maxOccurrences ?? null,
      status: data.status,
    });
  });

  return {
    ...template,
    amount: template.amount.toNumber(),
    startDate: databaseDateToDateOnly(template.startDate),
    endDate: template.endDate ? databaseDateToDateOnly(template.endDate) : null,
  };
};

export const createStandaloneScheduledTransactionTemplate = async (
  data: CreateStandaloneScheduledTemplateInput,
) => {
  const startDate = dateOnlyToDatabaseDate(data.startDate);
  const endDate = data.endDate ? dateOnlyToDatabaseDate(data.endDate) : null;

  const template = await withTransaction((db) =>
    createTemplate(db, {
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.type === "income" ? null : (data.category ?? null),
      startDate,
      dayOfMonth: data.dayOfMonth,
      endDate,
      maxOccurrences: data.maxOccurrences ?? null,
      status: data.status,
    }),
  );

  return {
    ...template,
    amount: template.amount.toNumber(),
    startDate: databaseDateToDateOnly(template.startDate),
    endDate: template.endDate ? databaseDateToDateOnly(template.endDate) : null,
  };
};

const archiveIfPastEndDate = async (
  tx: DbTransactionClient,
  template: { id: string; endDate: Date | null },
  scheduledAt: Date,
) => {
  if (template.endDate && isAfter(scheduledAt, template.endDate)) {
    await updateTemplateStatus(tx, template.id, { status: "archived", archivedAt: new Date() });
    return true;
  }
  return false;
};

const archiveIfMaxReached = async (
  tx: DbTransactionClient,
  template: { id: string; maxOccurrences: number | null },
  count: number,
) => {
  if (template.maxOccurrences !== null && count >= template.maxOccurrences) {
    await updateTemplateStatus(tx, template.id, { status: "archived", archivedAt: new Date() });
    return true;
  }
  return false;
};

export const generateScheduledTransactions = async (date: Date) => {
  const { monthStart, monthEnd } = getCurrentMonthRange(date);
  const { year, month } = getCurrentYearMonth(date);
  const today = startOfUtcDay(date);

  const templates = await findActiveTemplatesStartedBefore(monthEnd);

  let failedCount = 0;

  for (const { id, dayOfMonth } of templates) {
    const transactedAt = getDayInMonth(year, month, dayOfMonth);
    try {
      await withTransaction(async (tx) => {
        const template = await findTemplateForUpdate(tx, id);
        if (template?.status !== "active") {
          return;
        }

        const scheduledAt = getDayInMonth(year, month, template.dayOfMonth);
        if (
          isAfter(scheduledAt, today) ||
          !isOccurrenceWithinTemplateRange(scheduledAt, template.startDate, template.endDate)
        ) {
          await archiveIfPastEndDate(tx, template, scheduledAt);
          return;
        }

        const [count, existing] = await Promise.all([
          countTransactionsByTemplate(tx, template.id),
          findTransactionByTemplateInRange(tx, template.id, { monthStart, monthEnd }),
        ]);
        if (await archiveIfMaxReached(tx, template, count)) {
          return;
        }
        if (existing) {
          return;
        }

        await createTransaction(tx, {
          description: template.description,
          amount: template.amount.toNumber(),
          type: template.type,
          category: template.category,
          transactedAt: scheduledAt,
          templateId: template.id,
        });

        if (template.maxOccurrences !== null && count + 1 >= template.maxOccurrences) {
          await updateTemplateStatus(tx, template.id, {
            status: "archived",
            archivedAt: new Date(),
          });
        }
      });
    } catch (err) {
      if (isUniqueConstraintError(err) || isForeignKeyConstraintError(err)) {
        continue;
      }

      failedCount += 1;
      console.error("Failed to generate scheduled transaction.", {
        templateId: id,
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
