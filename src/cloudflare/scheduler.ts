import { generateScheduledTransactions } from "@/app/finance/scheduled/scheduled.service.server";

export const handleScheduled = async (controller: ScheduledController) => {
  await generateScheduledTransactions(new Date(controller.scheduledTime));
};
