export interface PublicBoard {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdById: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoardInput {
  name: string;
  description?: string;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string | null;
}
