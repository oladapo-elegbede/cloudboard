import express, { Express, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/index.js";
import { prisma } from "./infrastructure/database/prisma.js";
import { authRouter } from "./modules/auth/index.js";
import { userRouter } from "./modules/users/index.js";
import { organizationRouter } from "./modules/organizations/index.js";
import { boardRouter, organizationBoardRouter } from "./modules/boards/index.js";
import { boardColumnRouter, columnRouter } from "./modules/columns/index.js";
import { columnTaskRouter, boardTaskRouter, taskRouter } from "./modules/tasks/index.js";
import { taskCommentRouter, commentRouter } from "./modules/comments/index.js";
import { boardActivityRouter } from "./modules/activities/index.js";
import openApiSpec from "./openapi.json" with { type: "json" };

export const createApp = (): Express => {
  const app = express();

  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS,
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(cookieParser());

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get("/health/db", async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        success: true,
        data: {
          status: "ok",
          database: "connected",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Database health check failed:", error);
      res.status(503).json({
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Database connection failed",
        },
      });
    }
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/organizations", organizationRouter);
  app.use("/api/v1/organizations/:id/boards", organizationBoardRouter);
  app.use("/api/v1/boards", boardRouter);
  app.use("/api/v1/boards/:id/columns", boardColumnRouter);
  app.use("/api/v1/boards/:id/tasks", boardTaskRouter);
  app.use("/api/v1/columns", columnRouter);
  app.use("/api/v1/columns/:id/tasks", columnTaskRouter);
  app.use("/api/v1/tasks", taskRouter);
  app.use("/api/v1/tasks/:id/comments", taskCommentRouter);
  app.use("/api/v1/comments", commentRouter);
  app.use("/api/v1/boards/:id/activities", boardActivityRouter);

  return app;
};
