import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireMembership, requireRole } from "../organizations/authorization.middleware.js";
import { requireBoardAccess, requireBoardRole } from "./board.middleware.js";
import {
  handleCreateBoard,
  handleListBoards,
  handleGetBoard,
  handleUpdateBoard,
  handleArchiveBoard,
  handleRestoreBoard,
  handleDeleteBoard,
} from "./board.controller.js";

// Router for /organizations/:id/boards routes
const organizationBoardRouter = Router({ mergeParams: true });
organizationBoardRouter.use(requireAuth);

organizationBoardRouter.get("/", requireMembership, handleListBoards);
organizationBoardRouter.post("/", requireMembership, requireRole("MEMBER"), handleCreateBoard);

// Router for /boards/:id routes
const boardRouter = Router();
boardRouter.use(requireAuth);

boardRouter.get("/:id", requireBoardAccess, handleGetBoard);
boardRouter.patch("/:id", requireBoardAccess, requireBoardRole("MEMBER"), handleUpdateBoard);
boardRouter.post("/:id/archive", requireBoardAccess, requireBoardRole("ADMIN"), handleArchiveBoard);
boardRouter.post("/:id/restore", requireBoardAccess, requireBoardRole("ADMIN"), handleRestoreBoard);
boardRouter.delete("/:id", requireBoardAccess, requireBoardRole("ADMIN"), handleDeleteBoard);

export { organizationBoardRouter, boardRouter };
