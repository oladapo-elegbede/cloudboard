import { Router } from "express";
import { handleRegister, handleLogin, handleRefresh, handleLogout } from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/register", handleRegister);
authRouter.post("/login", handleLogin);
authRouter.post("/refresh", handleRefresh);
authRouter.post("/logout", handleLogout);

export { authRouter };
