

import { Router } from "express";
import { prisma } from "../../database/prisma";
import { SessionService } from "./service";
import { SessionController } from "./controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireCoach } from "../../middleware/requireCoach";

const router = Router()
const service = new SessionService(prisma)
const controller = new SessionController(service)

router.get('/calendar', requireAuth, controller.getCalendar.bind(controller))
router.post('/create', requireAuth, requireCoach, controller.createSession.bind(controller))
router.get('/:id', requireAuth, requireCoach, controller.getSession.bind(controller))
router.patch('/:id', requireAuth, requireCoach, controller.updateSession.bind(controller))
router.delete('/:id', requireAuth, requireCoach, controller.deleteSession.bind(controller))

export default router