import { createApp } from "./server.js";

const PORT = 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`CloudBoard API listening on port ${PORT}`);
});