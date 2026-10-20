

import { Router } from "express";
import { prisma } from "../../database/prisma";
import { SessionService } from "./service";
import { SessionController } from "./controller";

const router = Router()
const service = new SessionService(prisma)
const controller = new SessionController(service)

router.post('/create', controller.createSession.bind(controller))

export default router