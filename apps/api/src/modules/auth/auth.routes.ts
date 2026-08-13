import { Router } from "express";
import { handleRegister } from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/register", handleRegister);

export { authRouter };
