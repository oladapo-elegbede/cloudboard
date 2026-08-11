import express, { Express, Request, Response } from "express";
import { prisma } from "./infrastructure/database/index.js";

export const createApp = (): Express => {
  const app = express();

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

  return app;
};
