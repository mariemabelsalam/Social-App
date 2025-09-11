import type { Express, Request, Response } from 'express';
import express from 'express';
import { resolve } from 'node:path';
import { config } from 'dotenv';
config({ path: resolve('./config/.env.dev') });
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authController from './modules/auth/auth.controller'
import { globalErrorHandling } from './utils/response/error.response';
import connectDB from './DB/connection.db';



const limiter = rateLimit({
    windowMs: 60 * 60000,
    limit: 2000,
    message: { error: "too many request please try again later" },
    statusCode: 429
})




const bootstartp = async (): Promise<void> => {
    const app: Express = express();
    const port: number | string = process.env.PORT || 5000
    app.use(cors(), helmet(), express.json(), limiter);

    app.get('/', (req: Request, res: Response) => {
        res.json({ message: `welcome to ${process.env.APPLICATION_NAME}` })
    })

    app.use('/auth', authController)

    app.use("{/*dummy}", (req: Request, res: Response) => {
        res.status(404).json({ message: 'invalid routing ' })
    })

    app.use(globalErrorHandling)

    await connectDB()

    app.listen(port, () => {
        console.log(`server is running on port ${port}`);

    })
}

export default bootstartp