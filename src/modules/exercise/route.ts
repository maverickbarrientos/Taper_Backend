
import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAthlete } from "../../middleware/requireAthlete";
import { requireCoach } from "../../middleware/requireCoach";
import { prisma } from "../../database/prisma";
import { ExerciseService } from "./service";
import { ExerciseController } from "./controller";

const router = Router()
const service = new ExerciseService(prisma)
const controller = new ExerciseController(service)

router.post('/create', requireAuth, requireCoach, controller.addExercisesToSession.bind(controller))
router.post('/log', requireAuth, requireAthlete, controller.logExercise.bind(controller))
router.patch('/log/:exerciseId', requireAuth, requireAthlete, controller.updateLog.bind(controller))

export default router