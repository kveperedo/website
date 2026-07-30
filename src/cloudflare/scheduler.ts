import { generateScheduledTransactions } from "@/utils/scheduled-transactions.server";

export const handleScheduled = async (controller: ScheduledController) => {
  await generateScheduledTransactions(new Date(controller.scheduledTime));
};
