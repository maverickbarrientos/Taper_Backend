

import { Router } from "express";
import { prisma } from "../../database/prisma";
import { ProgramService } from "./service";
import { ProgramController } from "./controller";

const router = Router();
const service = new ProgramService(prisma);
const controller = new ProgramController(service);

router.post('/create', controller.createProgram.bind(controller));
router.post('/phase/create', controller.createPhase.bind(controller));

router.get('/', controller.getAllPrograms.bind(controller));
router.get('/:id', controller.getAthleteProgram.bind(controller));

export default router