export type { PublicComment, CreateCommentInput, UpdateCommentInput } from "./comment.types.js";

export { createCommentSchema, updateCommentSchema } from "./comment.schemas.js";
export type { CreateCommentSchemaInput, UpdateCommentSchemaInput } from "./comment.schemas.js";

export {
  createComment,
  listTaskComments,
  getComment,
  updateComment,
  deleteComment,
  CommentNotFoundError,
  NotCommentAuthorError,
  InsufficientDeletePermissionError,
} from "./comment.service.js";

export { requireCommentAccess } from "./comment.middleware.js";
export { taskCommentRouter, commentRouter } from "./comment.routes.js";
