import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireBoardAccess, requireBoardRole } from "../boards/board.middleware.js";
import { requireColumnAccess, requireColumnRole } from "./column.middleware.js";
import {
  handleCreateColumn,
  handleListColumns,
  handleUpdateColumn,
  handleMoveColumn,
  handleDeleteColumn,
} from "./column.controller.js";

// Router for /boards/:id/columns routes
const boardColumnRouter = Router({ mergeParams: true });
boardColumnRouter.use(requireAuth);

boardColumnRouter.get("/", requireBoardAccess, handleListColumns);
boardColumnRouter.post("/", requireBoardAccess, requireBoardRole("MEMBER"), handleCreateColumn);

// Router for /columns/:id routes
const columnRouter = Router();
columnRouter.use(requireAuth);

columnRouter.patch("/:id", requireColumnAccess, requireColumnRole("MEMBER"), handleUpdateColumn);
columnRouter.post("/:id/move", requireColumnAccess, requireColumnRole("MEMBER"), handleMoveColumn);
columnRouter.delete("/:id", requireColumnAccess, requireColumnRole("MEMBER"), handleDeleteColumn);

export { boardColumnRouter, columnRouter };
