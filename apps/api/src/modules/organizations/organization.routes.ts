import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { requireMembership, requireRole } from "./authorization.middleware.js";
import {
  handleCreateOrganization,
  handleListOrganizations,
  handleGetOrganization,
  handleListMembers,
  handleInviteMember,
  handleRemoveMember,
} from "./organization.controller.js";

const organizationRouter = Router();

organizationRouter.use(requireAuth);

organizationRouter.post("/", handleCreateOrganization);
organizationRouter.get("/", handleListOrganizations);

organizationRouter.get("/:id", requireMembership, handleGetOrganization);
organizationRouter.get("/:id/members", requireMembership, handleListMembers);

organizationRouter.post(
  "/:id/members",
  requireMembership,
  requireRole("ADMIN"),
  handleInviteMember,
);

organizationRouter.delete(
  "/:id/members/:userId",
  requireMembership,
  requireRole("ADMIN"),
  handleRemoveMember,
);

export { organizationRouter };
