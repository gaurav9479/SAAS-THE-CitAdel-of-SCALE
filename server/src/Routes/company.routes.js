import { Router } from "express";
import {
    registerCompany,
    getAllCompanies,
    getCompanyById,
    getCompanyStats,
    updateSubscription,
    registerAdmin
} from "../controllers/company.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyRoles } from "../middlewares/rbac.middleware.js";
import { verifyCompanyAccess } from "../middlewares/companyAccess.middleware.js";

const router = Router();


router.post("/register", registerCompany);
router.get("/", verifyJWT, verifyRoles("super-owner"), getAllCompanies); // Only SuperOwner can see all

router.use(verifyJWT);

router.post("/admin/register", verifyRoles("admin", "super-owner"), registerAdmin);


router.route("/:companyId")
    .get(verifyRoles("admin", "super-owner", "engineer", "user"), verifyCompanyAccess, getCompanyById)

    

router.get("/:companyId/stats", verifyRoles("admin", "super-owner"), verifyCompanyAccess, getCompanyStats);
router.patch("/:companyId/subscription", verifyRoles("super-owner"), verifyCompanyAccess, updateSubscription);

export default router;
