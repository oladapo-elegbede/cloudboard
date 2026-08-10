import { env } from "./config/index.js";
import { createApp } from "./server.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`CloudBoard API listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
});