

import { Router } from "express";
import { prisma } from "../../database/prisma";
import { UserController } from "./controller";
import { UserService } from "./service";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCoach } from "../../middleware/requireCoach";

const router = Router();
const service = new UserService(prisma)
const controller = new UserController(service)

router.get('/athletes', requireAuth, requireCoach, controller.getAllAthletes.bind(controller));
router.get('/athletes/:id', requireAuth, requireCoach, controller.getAthlete.bind(controller));
router.post('/athletes/create', requireAuth, requireCoach, controller.createAthlete.bind(controller));
router.patch('/athletes/:id', requireAuth, requireCoach, controller.updateAthleteProfile.bind(controller));
router.delete('/athletes/:id', requireAuth, requireCoach, controller.deleteAthlete.bind(controller));
router.get('/me', requireAuth, controller.getProfile.bind(controller));
router.patch('/me', requireAuth, controller.updateProfile.bind(controller));
router.get('/athlete/me', requireAuth, controller.getAthlete.bind(controller))

export default router