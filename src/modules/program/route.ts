

import { Router } from "express";
import { prisma } from "../../database/prisma";
import { ProgramService } from "./service";
import { ProgramController } from "./controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAthlete } from "../../middleware/requireAthlete";
import { requireCoach } from "../../middleware/requireCoach";

const router = Router();
const service = new ProgramService(prisma);
const controller = new ProgramController(service);

// static and multi-segment routes first, parameterised '/:id' routes last so they never shadow them
router.get('/', requireAuth, requireCoach, controller.getAllPrograms.bind(controller));
router.post('/create', requireAuth, requireCoach, controller.createProgram.bind(controller));

router.get('/me', requireAuth, controller.getAthleteProgram.bind(controller));
router.get('/me/detail', requireAuth, requireAthlete, controller.getMyProgramView.bind(controller));
router.get('/me/list', requireAuth, requireAthlete, controller.getMyProgramList.bind(controller));
router.get('/me/:id', requireAuth, requireAthlete, controller.getMyProgramById.bind(controller));

router.post('/phase/create', requireAuth, requireCoach, controller.createPhase.bind(controller));
router.get('/phase/:id', requireAuth, requireCoach, controller.getPhase.bind(controller));
router.patch('/phase/:id', requireAuth, requireCoach, controller.updatePhase.bind(controller));
router.delete('/phase/:id', requireAuth, requireCoach, controller.deletePhase.bind(controller));

router.get('/:id/week', requireAuth, requireCoach, controller.getProgramWeekData.bind(controller));
router.post('/:id/summary', requireAuth, requireCoach, controller.generateWeeklySummary.bind(controller));
router.get('/:id', requireAuth, requireCoach, controller.getProgram.bind(controller));
router.patch('/:id', requireAuth, requireCoach, controller.updateProgram.bind(controller));
router.delete('/:id', requireAuth, requireCoach, controller.deleteProgram.bind(controller));

export default router