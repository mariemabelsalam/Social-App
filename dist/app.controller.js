"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)('./config/.env.dev') });
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const auth_controller_1 = __importDefault(require("./modules/auth/auth.controller"));
const user_controller_1 = __importDefault(require("./modules/user/user.controller"));
const error_response_1 = require("./utils/response/error.response");
const connection_db_1 = __importDefault(require("./DB/connection.db"));
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
    app.use('/auth', auth_controller_1.default);
    app.use('/user', user_controller_1.default);
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
