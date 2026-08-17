import type { Activity } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";
import type { LogActivityInput } from "./activity.types.js";

export const createActivity = async (data: LogActivityInput): Promise<Activity> => {
  return prisma.activity.create({
    data: {
      organizationId: data.organizationId,
      boardId: data.boardId,
      actorId: data.actorId,
      actorName: data.actorName,
      actionType: data.actionType,
      entityType: data.entityType,
      entityId: data.entityId,
      entitySnapshot: data.entitySnapshot ?? Prisma.JsonNull,
    },
  });
};

interface FindActivitiesByBoardOptions {
  boardId: string;
  limit: number;
  offset: number;
}

export const findActivitiesByBoard = async (
  options: FindActivitiesByBoardOptions,
): Promise<Activity[]> => {
  return prisma.activity.findMany({
    where: { boardId: options.boardId },
    orderBy: { createdAt: "desc" },
    take: options.limit,
    skip: options.offset,
  });
};

export const countActivitiesByBoard = async (boardId: string): Promise<number> => {
  return prisma.activity.count({
    where: { boardId },
  });
};
