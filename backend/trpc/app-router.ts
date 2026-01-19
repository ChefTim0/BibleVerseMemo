import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { authRouter } from "./routes/auth";
import { progressRouter } from "./routes/progress";
import { socialRouter } from "./routes/social";
import { bibleRouter } from "./routes/bible";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  auth: authRouter,
  progress: progressRouter,
  social: socialRouter,
  bible: bibleRouter,
});

export type AppRouter = typeof appRouter;
