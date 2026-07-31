import handler from "@tanstack/react-start/server-entry";

import { handleScheduled } from "./cloudflare/scheduler";

export default {
  fetch: handler.fetch,
  async scheduled(controller: ScheduledController) {
    await handleScheduled(controller);
  },
};
