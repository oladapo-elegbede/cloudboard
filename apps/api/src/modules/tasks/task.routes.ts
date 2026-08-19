import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireColumnAccess, requireColumnRole } from "../columns/column.middleware.js";
import { requireBoardAccess } from "../boards/board.middleware.js";
import { requireTaskAccess, requireTaskRole } from "./task.middleware.js";
import {
  handleCreateTask,
  handleListTasks,
  handleListBoardTasks,
  handleGetTask,
  handleUpdateTask,
  handleMoveTask,
  handleDeleteTask,
} from "./task.controller.js";

// Router for /columns/:id/tasks routes
const columnTaskRouter = Router({ mergeParams: true });
columnTaskRouter.use(requireAuth);

columnTaskRouter.get("/", requireColumnAccess, handleListTasks);
columnTaskRouter.post("/", requireColumnAccess, requireColumnRole("MEMBER"), handleCreateTask);

// Router for /boards/:id/tasks routes (bulk fetch)
const boardTaskRouter = Router({ mergeParams: true });
boardTaskRouter.use(requireAuth);

boardTaskRouter.get("/", requireBoardAccess, handleListBoardTasks);

// Router for /tasks/:id routes
const taskRouter = Router();
taskRouter.use(requireAuth);

taskRouter.get("/:id", requireTaskAccess, handleGetTask);
taskRouter.patch("/:id", requireTaskAccess, requireTaskRole("MEMBER"), handleUpdateTask);
taskRouter.post("/:id/move", requireTaskAccess, requireTaskRole("MEMBER"), handleMoveTask);
taskRouter.delete("/:id", requireTaskAccess, requireTaskRole("MEMBER"), handleDeleteTask);

export { columnTaskRouter, boardTaskRouter, taskRouter };
