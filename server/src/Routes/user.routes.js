import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.post("/user-register", registerUser);
router.post("/user-login", loginUser);


router.use(verifyJWT);
router.post("/logout", logoutUser);


export default router;
