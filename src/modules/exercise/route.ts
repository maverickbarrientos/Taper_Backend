
import { Router } from "express";
import { prisma } from "../../database/prisma";
import { ExerciseService } from "./service";
import { ExerciseController } from "./controller";

const router = Router()
const service = new ExerciseService(prisma)
const controller = new ExerciseController(service)

router.post('/create', controller.addExerciseToSession.bind(controller))
router.post('/log', controller.logExercise.bind(controller))

export default router