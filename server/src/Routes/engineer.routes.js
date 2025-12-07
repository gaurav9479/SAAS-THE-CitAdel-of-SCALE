
import { Router } from "express";
import { registerEngineer, loginEngineer, respondToIssue, logoutEngineer } from "../controllers/engineer.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyRoles } from "../middlewares/rbac.middleware.js";

const router = Router();

router.post("/register", verifyJWT, verifyRoles("admin"), registerEngineer); // Only Admin creates engineers
router.post("/login", loginEngineer);


router.use(verifyJWT);
router.post("/logout", logoutEngineer);
router.patch("/respond/:issueId", verifyRoles("engineer"), respondToIssue);

export default router;

