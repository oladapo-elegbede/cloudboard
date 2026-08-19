export type { PublicTask, CreateTaskInput, UpdateTaskInput, MoveTaskInput } from "./task.types.js";

export { createTaskSchema, updateTaskSchema, moveTaskSchema } from "./task.schemas.js";
export type {
  CreateTaskSchemaInput,
  UpdateTaskSchemaInput,
  MoveTaskSchemaInput,
} from "./task.schemas.js";

export {
  createTask,
  listColumnTasks,
  listBoardTasks,
  getTask,
  updateTask,
  moveTask,
  deleteTask,
  TaskNotFoundError,
  ColumnNotFoundForTaskError,
  TaskColumnMismatchError,
  InvalidTaskPositionError,
} from "./task.service.js";

export { requireTaskAccess, requireTaskRole } from "./task.middleware.js";
export { columnTaskRouter, boardTaskRouter, taskRouter } from "./task.routes.js";
