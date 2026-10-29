import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../lib/errors";
import { UserRole } from "../generated/prisma/enums";

export function requireCoach(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== UserRole.COACH) throw new ForbiddenError("Only coaches can access this resource");
  next();
}