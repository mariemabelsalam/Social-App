import cors from 'cors';
import { config } from 'dotenv';
import type { Express, Request, Response } from 'express';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { resolve } from 'node:path';
import connectDB from './DB/connection.db';
import authController from './modules/auth/auth.controller';
import userController from './modules/user/user.controller';
import { BadRequestException, globalErrorHandling } from './utils/response/error.response';
import { createGetPreSignedLink, deleteFile, getFile } from './utils/multer/s3.config';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream';
config({ path: resolve('./config/.env.dev') });



const createS3WriteStreamPipe = promisify(pipeline)

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
    app.use('/user', userController)

    app.get("test", async (req: Request, res: Response) => {
        const { Key } = req.query as { Key: string };
        const result = await deleteFile({ Key });
        return res.json({ message: "done", data: { result } })
    })

    app.get("/upload/*path", async (req: Request, res: Response): Promise<void> => {
        const { downloadName, download = "false" } = req.query as {
            downloadName?: string, download?: string
        }
        const { path } = req.params as unknown as { path: string[] }
        const Key = path.join("/")
        const s3Response = await getFile({ Key })
        if (!s3Response?.Body) {
            throw new BadRequestException("fail to fetch this assests")
        }
        res.setHeader("Content-type", `${s3Response.ContentType || "application/octet-stream"}`);
        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment;filename="${downloadName || Key.split("/").pop()}"`);
        }
        return await createS3WriteStreamPipe(s3Response.Body as NodeJS.ReadableStream, res)
    })

    app.get("/upload/preSigned/*path", async (req: Request, res: Response): Promise<Response> => {
        const { downloadName, download = "false", expiresIn = 120 } = req.query as {
            downloadName?: string, download?: string, expiresIn?: number
        }
        const { path } = req.params as unknown as { path: string[] }
        const Key = path.join("/")
        const url = await createGetPreSignedLink({
            Key, expiresIn, downloadName: downloadName as string, download
        })
        return res.json({ message: "done", data: { url } })
    })

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