import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);


router.use(verifyJWT);
router.post("/logout", logoutUser);


export default router;
