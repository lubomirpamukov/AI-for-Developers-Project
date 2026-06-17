import "dotenv/config";
import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";

const app = createApp();
const { port } = getEnv();

app.listen(port, () => {
  console.log(`QuizMaker API listening on port ${port}`);
});
