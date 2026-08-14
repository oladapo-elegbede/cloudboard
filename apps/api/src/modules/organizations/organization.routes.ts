import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
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
organizationRouter.get("/:id", handleGetOrganization);
organizationRouter.get("/:id/members", handleListMembers);
organizationRouter.post("/:id/members", handleInviteMember);
organizationRouter.delete("/:id/members/:userId", handleRemoveMember);

export { organizationRouter };
