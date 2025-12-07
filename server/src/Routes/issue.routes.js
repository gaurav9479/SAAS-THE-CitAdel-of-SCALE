import { Router } from "express";
import {
    createIssue,
    getAllIssues,
    getIssueById,
    getUserIssues,
    getEngineerIssues,
    updateIssueStatus,
    assignEngineer,
    updateIssue,
    deleteIssue
} from "../controllers/issue.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyRoles } from "../middlewares/rbac.middleware.js";

import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/create", verifyRoles("user"), upload.single("attachment"), createIssue);

router.get("/", verifyRoles("admin", "company"), getAllIssues); // Admin/Company wide
router.get("/user", verifyRoles("user"), getUserIssues); // User specific
router.get("/engineer", verifyRoles("engineer"), getEngineerIssues); // Engineer specific
router.get("/:issueId", verifyRoles("user", "admin", "engineer"), getIssueById);


router.patch("/:issueId/status", verifyRoles("engineer", "admin"), updateIssueStatus); // Engineer/Admin
router.patch("/:issueId/assign", verifyRoles("admin"), assignEngineer); // Admin
router.patch("/:issueId", verifyRoles("user", "admin"), updateIssue);


router.delete("/:issueId", verifyRoles("admin", "user"), deleteIssue);


export default router;
