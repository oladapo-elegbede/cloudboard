import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireTaskAccess, requireTaskRole } from "../tasks/task.middleware.js";
import { requireCommentAccess } from "./comment.middleware.js";
import {
  handleCreateComment,
  handleListComments,
  handleUpdateComment,
  handleDeleteComment,
} from "./comment.controller.js";

// Router for /tasks/:id/comments routes
const taskCommentRouter = Router({ mergeParams: true });
taskCommentRouter.use(requireAuth);

taskCommentRouter.get("/", requireTaskAccess, handleListComments);
taskCommentRouter.post("/", requireTaskAccess, requireTaskRole("MEMBER"), handleCreateComment);

// Router for /comments/:id routes
const commentRouter = Router();
commentRouter.use(requireAuth);

commentRouter.patch("/:id", requireCommentAccess, handleUpdateComment);
commentRouter.delete("/:id", requireCommentAccess, handleDeleteComment);

export { taskCommentRouter, commentRouter };
