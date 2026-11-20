import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

export default defineConfig({
  testDir: "./tests",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60000,
  reporter: [["html", { open: "never" }]],
  use: { trace: "on-first-retry" },
});
