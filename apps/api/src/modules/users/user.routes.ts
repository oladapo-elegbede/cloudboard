import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { handleGetMe } from "./user.controller.js";

const userRouter = Router();

userRouter.get("/me", requireAuth, handleGetMe);

export { userRouter };
