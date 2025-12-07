import { Router } from "express";
import {
    loginAdmin,
    logoutAdmin,
    getDashboardStats,
    getCompanyInfo
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/login").post(loginAdmin);
router.route("/company-info").get(getCompanyInfo);


router.route("/logout").post(verifyJWT, logoutAdmin);
router.route("/dashboard-stats").get(verifyJWT, getDashboardStats);

export default router;
