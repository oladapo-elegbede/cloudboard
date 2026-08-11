import express, { Express, Request, Response } from "express";

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

  return app;
};
