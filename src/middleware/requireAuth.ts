
import { Express, Request, Response, NextFunction } from "express";
import supabase from "../lib/supabase";
import { prisma } from "../database/prisma";
import { ForbiddenError } from "../lib/errors";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string, email?: string | undefined, role?: string }
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {

  const headers = req.headers.authorization;
  const token = headers?.startsWith("Bearer ") ? headers.slice(7) :undefined;

  if (!token) throw new ForbiddenError("Missing access token")

  // getClaims throws (instead of returning an error) when the token isn't a well-formed JWT
  const { data, error } = await supabase.auth.getClaims(token).catch(e => ({ data: null, error: e }));

  if (error || !data?.claims) {
    throw new ForbiddenError("Invalid or expired token");
  }

  // the users table is the source of truth for role; JWT metadata is missing for accounts created outside createAthlete
  const dbUser = await prisma.user.findUnique({ where: { id: data.claims.sub }, select: { role: true, deletedAt: true } });

  if (dbUser?.deletedAt) throw new ForbiddenError("This account has been deleted");

  req.user = {
    id: data.claims.sub,
    email: data.claims.email,
    role: dbUser?.role ?? data.claims.user_metadata?.role,
  }

  next();
}