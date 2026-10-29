import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../lib/errors";
import { UserRole } from "../generated/prisma/enums";

export function requireAthlete(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== UserRole.ATHLETE) throw new ForbiddenError("Only athletes can access this resource");
  next();
}
