
import express, { Express, Request, Response } from "express";
import cors from "cors"
import userRouter from "./modules/user/route";
import programRouter from "./modules/program/route";
import sessionRouter from "./modules/session/route";
import exerciseRouter from "./modules/exercise/route"
import dashboardRouter from "./modules/dashboard/route"

import { logger } from "./middleware/logger";

const app: Express = express()

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)
app.use(logger);
app.use(express.json())
app.use('/api/users', userRouter)
app.use('/api/program', programRouter)
app.use('/api/session', sessionRouter)
app.use('/api/exercise', exerciseRouter)
app.use('/api/dashboard', dashboardRouter)

app.get('/', (req: Request, res: Response) => {
  res.send("Hello, World!");
})

export default app

// todo:
// coach login
// athlete login
// create athlete email credentials