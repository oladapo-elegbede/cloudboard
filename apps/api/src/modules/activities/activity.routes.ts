import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireBoardAccess } from "../boards/board.middleware.js";
import { handleListBoardActivities } from "./activity.controller.js";

const boardActivityRouter = Router({ mergeParams: true });
boardActivityRouter.use(requireAuth);

boardActivityRouter.get("/", requireBoardAccess, handleListBoardActivities);

export { boardActivityRouter };
