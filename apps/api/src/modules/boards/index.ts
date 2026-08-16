export type { PublicBoard, CreateBoardInput, UpdateBoardInput } from "./board.types.js";

export { createBoardSchema, updateBoardSchema } from "./board.schemas.js";
export type { CreateBoardSchemaInput, UpdateBoardSchemaInput } from "./board.schemas.js";

export {
  createBoard,
  listOrganizationBoards,
  getBoard,
  updateBoard,
  archiveBoard,
  restoreBoard,
  deleteBoard,
  BoardNotFoundError,
  BoardNotArchivedError,
} from "./board.service.js";

export { requireBoardAccess, requireBoardRole } from "./board.middleware.js";
export { organizationBoardRouter, boardRouter } from "./board.routes.js";
