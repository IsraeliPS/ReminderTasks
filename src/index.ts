import cron from "node-cron";
import { config } from "./config";
import { runOnce } from "./scheduler";

cron.schedule(config.pollCron, () => {
  runOnce().catch((e) => console.error("scheduler error:", e));
});

console.log(`Running reminders. Cron: ${config.pollCron}`);
