import { Router } from "express";
import {
    registerSuperOwner,
    loginSuperOwner,
    logoutSuperOwner,
    getAllCompanies,
    getCompanyDetails,
    updateCompanySubscription,
    getDashboardStats
} from "../controllers/superOwner.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.post("/register", registerSuperOwner);
router.post("/login", loginSuperOwner);


router.use(verifyJWT);
router.post("/logout", logoutSuperOwner);


router.get("/dashboard/stats", getDashboardStats);
router.get("/companies", getAllCompanies); 
router.get("/companies/:companyId", getCompanyDetails);
router.patch("/companies/:companyId/subscription", updateCompanySubscription);

export default router;
