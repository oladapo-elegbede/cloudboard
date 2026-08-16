import type { Request, Response } from "express";
import { createOrganizationSchema, inviteMemberSchema } from "./organization.schemas.js";
import {
  createOrganization,
  listUserOrganizations,
  getOrganizationForUser,
  listOrganizationMembers,
  inviteMember,
  removeMember,
  OrganizationNotFoundError,
  NotOrganizationMemberError,
  UserNotFoundError,
  MembershipAlreadyExistsError,
  CannotRemoveLastOwnerError,
} from "./organization.service.js";

const requireAuthenticatedUser = (
  req: Request,
  res: Response,
): { sub: string; email: string } | null => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: "NOT_AUTHENTICATED",
        message: "Authentication required",
      },
    });
    return null;
  }
  return req.user;
};

const getStringParam = (req: Request, res: Response, paramName: string): string | null => {
  const value = req.params[paramName];
  if (typeof value !== "string" || value.length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PARAM",
        message: `${paramName} is required`,
      },
    });
    return null;
  }
  return value;
};

export const handleCreateOrganization = async (req: Request, res: Response): Promise<void> => {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;

  const parseResult = createOrganizationSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid organization data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const organization = await createOrganization(user.sub, parseResult.data.name);
    res.status(201).json({
      success: true,
      data: { organization },
    });
  } catch (error) {
    console.error("Create organization failed:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};

export const handleListOrganizations = async (req: Request, res: Response): Promise<void> => {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;

  try {
    const organizations = await listUserOrganizations(user.sub);
    res.status(200).json({
      success: true,
      data: { organizations },
    });
  } catch (error) {
    console.error("List organizations failed:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};

export const handleGetOrganization = async (req: Request, res: Response): Promise<void> => {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;

  const organizationId = getStringParam(req, res, "id");
  if (!organizationId) return;

  try {
    const organization = await getOrganizationForUser(user.sub, organizationId);
    res.status(200).json({
      success: true,
      data: { organization },
    });
  } catch (error) {
    if (error instanceof NotOrganizationMemberError) {
      res.status(403).json({
        success: false,
        error: {
          code: "NOT_MEMBER",
          message: error.message,
        },
      });
      return;
    }
    if (error instanceof OrganizationNotFoundError) {
      res.status(404).json({
        success: false,
        error: {
          code: "ORGANIZATION_NOT_FOUND",
          message: error.message,
        },
      });
      return;
    }

    console.error("Get organization failed:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};

export const handleListMembers = async (req: Request, res: Response): Promise<void> => {
  const organizationId = getStringParam(req, res, "id");
  if (!organizationId) return;

  try {
    const members = await listOrganizationMembers(organizationId);
    res.status(200).json({
      success: true,
      data: { members },
    });
  } catch (error) {
    console.error("List members failed:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};

export const handleInviteMember = async (req: Request, res: Response): Promise<void> => {
  const organizationId = getStringParam(req, res, "id");
  if (!organizationId) return;

  const parseResult = inviteMemberSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid invitation data",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const membership = await inviteMember(organizationId, parseResult.data);
    res.status(201).json({
      success: true,
      data: { membership },
    });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: error.message,
        },
      });
      return;
    }
    if (error instanceof MembershipAlreadyExistsError) {
      res.status(409).json({
        success: false,
        error: {
          code: "ALREADY_MEMBER",
          message: error.message,
        },
      });
      return;
    }

    console.error("Invite member failed:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};

export const handleRemoveMember = async (req: Request, res: Response): Promise<void> => {
  const organizationId = getStringParam(req, res, "id");
  if (!organizationId) return;

  const memberUserId = getStringParam(req, res, "userId");
  if (!memberUserId) return;

  try {
    await removeMember(organizationId, memberUserId);
    res.status(200).json({
      success: true,
      data: { message: "Member removed successfully" },
    });
  } catch (error) {
    if (error instanceof CannotRemoveLastOwnerError) {
      res.status(400).json({
        success: false,
        error: {
          code: "CANNOT_REMOVE_LAST_OWNER",
          message: error.message,
        },
      });
      return;
    }

    console.error("Remove member failed:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
};
