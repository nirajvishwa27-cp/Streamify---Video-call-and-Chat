import express from "express";
import {signup, login, logout, onboard, me} from "../controllers/auth.controller.js"
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup)

router.post("/login",login)

router.post("/logout",logout)


router.post("/onboarding",protectRoute, onboard)

router.get("/me", protectRoute, me)

export default router;