import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "@/routes/auth";
import webhooks from "@/routes/webhooks";
import user from "@/routes/user";

const app = new Hono();

// Add CORS middleware
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://yourdomain.com"], // Add your frontend URLs
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

// Health check endpoint
app.get("/", (c) => {
  return c.json({ message: "Backend API is running", status: "healthy" });
});

// Mount routes
app.route("/api/auth", auth);
app.route("/api/webhooks", webhooks);
app.route("/api/user", user);

export default app;
