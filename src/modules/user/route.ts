

import { Router } from "express";
import { prisma } from "../../database/prisma";
import { UserController } from "./controller";
import { UserService } from "./service";

const router = Router();
const service = new UserService(prisma)
const controller = new UserController(service)

router.post('/athletes/create', controller.createAthlete.bind(controller))

export default router