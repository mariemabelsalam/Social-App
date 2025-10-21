"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = require("express-rate-limit");
const helmet_1 = __importDefault(require("helmet"));
const node_path_1 = require("node:path");
const node_stream_1 = require("node:stream");
const node_util_1 = require("node:util");
const connection_db_1 = __importDefault(require("./DB/connection.db"));
const modules_1 = require("./modules");
const s3_config_1 = require("./utils/multer/s3.config");
const error_response_1 = require("./utils/response/error.response");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)('./config/.env.dev') });
const createS3WriteStreamPipe = (0, node_util_1.promisify)(node_stream_1.pipeline);
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 60000,
    limit: 2000,
    message: { error: "too many request please try again later" },
    statusCode: 429
});
const bootstartp = async () => {
    const app = (0, express_1.default)();
    const port = process.env.PORT || 5000;
    app.use((0, cors_1.default)(), (0, helmet_1.default)(), express_1.default.json(), limiter);
    app.get('/', (req, res) => {
        res.json({ message: `welcome to ${process.env.APPLICATION_NAME}` });
    });
    app.use('/auth', modules_1.authRouter);
    app.use('/user', modules_1.userRouter);
    app.get("test", async (req, res) => {
        const { Key } = req.query;
        const result = await (0, s3_config_1.deleteFile)({ Key });
        return res.json({ message: "done", data: { result } });
    });
    app.get("/upload/*path", async (req, res) => {
        const { downloadName, download = "false" } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const s3Response = await (0, s3_config_1.getFile)({ Key });
        if (!s3Response?.Body) {
            throw new error_response_1.BadRequestException("fail to fetch this assests");
        }
        res.setHeader("Content-type", `${s3Response.ContentType || "application/octet-stream"}`);
        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment;filename="${downloadName || Key.split("/").pop()}"`);
        }
        return await createS3WriteStreamPipe(s3Response.Body, res);
    });
    app.get("/upload/preSigned/*path", async (req, res) => {
        const { downloadName, download = "false", expiresIn = 120 } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await (0, s3_config_1.createGetPreSignedLink)({
            Key, expiresIn, downloadName: downloadName, download
        });
        return res.json({ message: "done", data: { url } });
    });
    app.use("{/*dummy}", (req, res) => {
        res.status(404).json({ message: 'invalid routing ' });
    });
    app.use(error_response_1.globalErrorHandling);
    await (0, connection_db_1.default)();
    app.listen(port, () => {
        console.log(`server is running on port ${port}`);
    });
};
exports.default = bootstartp;
