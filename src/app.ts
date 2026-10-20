
import express, { Express, Request, Response } from "express";
import userRouter from "./modules/user/route";
import programRouter from "./modules/program/route";
import sessionRouter from "./modules/session/route";
import exerciseRouter from "./modules/exercise/route"

const app: Express = express()

app.use(express.json())
app.use('/api/users', userRouter)
app.use('/api/program', programRouter)
app.use('/api/session', sessionRouter)
app.use('/api/exercise', exerciseRouter)

app.get('/', (req: Request, res: Response) => {
  res.send("Hello, World!");
})

export default app