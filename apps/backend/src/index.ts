import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "@/routes/auth";
import webhooks from "@/routes/webhooks";
import user from "@/routes/user";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: [process.env.WEB_APP_URL!],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "svix-id",
      "svix-timestamp",
      "svix-signature",
    ],
  })
);

app.get("/", (c) => {
  return c.json("OK - Version 0.0.1");
});

app.get("/health", (c) => {
  return c.json("OK - Version 0.0.1");
});

app.route("/api/auth", auth);
app.route("/api/webhooks", webhooks);
app.route("/api/user", user);

export default app;
