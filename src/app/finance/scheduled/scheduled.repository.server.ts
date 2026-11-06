import type { Prisma } from "@/generated/prisma/client";
import type { ScheduledTransactionStatus } from "@/generated/prisma/enums";

import { getDb, type DbTransactionClient } from "@/app/infra/database/client.server";

export const findActiveAndPausedTemplates = async () => {
  return await getDb().scheduledTransactionTemplate.findMany({
    where: { status: { in: ["active", "paused"] } },
    orderBy: [{ dayOfMonth: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { transactions: true } },
    },
  });
};

export const findArchivedTemplates = async () => {
  return await getDb().scheduledTransactionTemplate.findMany({
    where: { status: "archived" },
    orderBy: [{ archivedAt: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { transactions: true } },
    },
  });
};

export const countArchivedTemplates = async () => {
  return await getDb().scheduledTransactionTemplate.count({
    where: { status: "archived" },
  });
};

export const findUpcomingTemplates = async ({
  monthStart,
  rangeEnd,
}: {
  monthStart: Date;
  rangeEnd: Date;
}) => {
  return await getDb().scheduledTransactionTemplate.findMany({
    where: {
      status: "active",
      startDate: { lt: rangeEnd },
      OR: [{ endDate: null }, { endDate: { gte: monthStart } }],
    },
    include: {
      _count: { select: { transactions: true } },
      transactions: {
        where: { transactedAt: { gte: monthStart, lt: rangeEnd } },
        select: { transactedAt: true },
      },
    },
  });
};

export const findExpenseTemplatesInMonth = async ({
  monthStart,
  monthEnd,
}: {
  monthStart: Date;
  monthEnd: Date;
}) => {
  return await getDb().scheduledTransactionTemplate.findMany({
    where: {
      status: "active",
      type: "expense",
      startDate: { lt: monthEnd },
      OR: [{ endDate: null }, { endDate: { gte: monthStart } }],
    },
    include: {
      _count: { select: { transactions: true } },
      transactions: {
        where: { transactedAt: { gte: monthStart, lt: monthEnd } },
        select: { transactedAt: true },
      },
    },
  });
};

export const findTemplateById = async (id: string) => {
  return await getDb().scheduledTransactionTemplate.findUnique({
    where: { id },
    include: {
      _count: { select: { transactions: true } },
    },
  });
};

export const findActiveTemplatesStartedBefore = async (date: Date) => {
  return await getDb().scheduledTransactionTemplate.findMany({
    where: { status: "active", startDate: { lt: date } },
  });
};

export const findTemplateStatusForUpdate = async (db: DbTransactionClient, id: string) => {
  return await db.scheduledTransactionTemplate.findUniqueOrThrow({
    where: { id },
    select: { status: true },
  });
};

export const findTemplateForUpdate = async (db: DbTransactionClient, id: string) => {
  return await db.scheduledTransactionTemplate.findUnique({ where: { id } });
};

export const createTemplate = async (
  db: DbTransactionClient,
  data: Prisma.ScheduledTransactionTemplateUncheckedCreateInput,
) => {
  return await db.scheduledTransactionTemplate.create({ data });
};

export const updateTemplate = async (
  db: DbTransactionClient,
  id: string,
  data: Prisma.ScheduledTransactionTemplateUncheckedUpdateInput,
) => {
  return await db.scheduledTransactionTemplate.update({ where: { id }, data });
};

export const updateTemplateStatus = async (
  db: DbTransactionClient,
  id: string,
  data: { status: ScheduledTransactionStatus; archivedAt?: Date },
) => {
  return await db.scheduledTransactionTemplate.update({ where: { id }, data });
};
