import app from "./app.js";
import { env } from "./config/env.js";

const HOST = "0.0.0.0";

app.listen(env.port, HOST, () => {
  console.log(`LMS API is running at http://localhost:${env.port}`);
});
