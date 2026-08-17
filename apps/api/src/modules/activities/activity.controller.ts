import type { Request, Response } from "express";
import { listActivitiesQuerySchema } from "./activity.schemas.js";
import { listBoardActivities } from "./activity.service.js";

const getStringParam = (req: Request, res: Response, paramName: string): string | null => {
  const value = req.params[paramName];
  if (typeof value !== "string" || value.length === 0) {
    res.status(400).json({
      success: false,
      error: { code: "MISSING_PARAM", message: `${paramName} is required` },
    });
    return null;
  }
  return value;
};

export const handleListBoardActivities = async (req: Request, res: Response): Promise<void> => {
  if (!req.membership) {
    res.status(500).json({
      success: false,
      error: {
        code: "MIDDLEWARE_ORDER_ERROR",
        message: "Activity listing requires membership context",
      },
    });
    return;
  }

  const boardId = getStringParam(req, res, "id");
  if (!boardId) return;

  const parseResult = listActivitiesQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const result = await listBoardActivities({
      boardId,
      role: req.membership.role,
      limit: parseResult.data.limit,
      cursor: parseResult.data.cursor,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("List activities failed:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
  }
};
