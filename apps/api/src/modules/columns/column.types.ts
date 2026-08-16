export interface PublicColumn {
  id: string;
  boardId: string;
  name: string;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateColumnInput {
  name: string;
  beforeColumnId?: string;
  afterColumnId?: string;
}

export interface UpdateColumnInput {
  name: string;
}

export interface MoveColumnInput {
  beforeColumnId?: string;
  afterColumnId?: string;
}
