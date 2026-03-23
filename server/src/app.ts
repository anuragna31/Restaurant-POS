import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.routes";
import { tablesRouter } from "./routes/tables.routes";
import { menuRouter } from "./routes/menu.routes";
import { ordersRouter } from "./routes/orders.routes";
import { usersRouter } from "./routes/users.routes";
import { kitchenAlertsRouter } from "./routes/kitchen-alerts.routes";
import { notificationsRouter } from "./routes/notifications.routes";
import { reportsRouter } from "./routes/reports.routes";
import { healthRouter } from "./routes/health.routes";
import { loadEnv } from "./config/loadEnv";

loadEnv();

const app = express();
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, try again later" }
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));
app.use(globalLimiter);

app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/tables", tablesRouter);
app.use("/api/v1/menu", menuRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/kitchen-alerts", kitchenAlertsRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/reports", reportsRouter);
app.use("/health", healthRouter);

export default app;
