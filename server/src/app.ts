import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./routes/auth.routes";
import { tablesRouter } from "./routes/tables.routes";
import { menuRouter } from "./routes/menu.routes";
import { ordersRouter } from "./routes/orders.routes";
import { usersRouter } from "./routes/users.routes";
import { loadEnv } from "./config/loadEnv";

loadEnv();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tables", tablesRouter);
app.use("/api/v1/menu", menuRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/users", usersRouter);

export default app;
