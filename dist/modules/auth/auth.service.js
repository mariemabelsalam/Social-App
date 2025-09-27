"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = require("../../DB/repository/user.repository");
const email_event_1 = require("../../utils/event/email.event");
const otp_1 = require("../../utils/otp");
const error_response_1 = require("../../utils/response/error.response");
const hash_security_1 = require("../../utils/security/hash.security");
const User_model_1 = require("./../../DB/models/User.model");
const token_security_1 = require("../../utils/security/token.security");
class AuthenticationService {
    UserModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    signup = async (req, res) => {
        let { userName, email, password } = req.body;
        const CheckUserExist = await this.UserModel.findOne({
            filter: { email },
            select: "email",
            options: { lean: true }
        });
        if (CheckUserExist) {
            throw new error_response_1.ConflictException("email axist");
        }
        const otp = (0, otp_1.generateNumberOtp)();
        const user = await this.UserModel.createUser({
            data: [{
                    userName, email,
                    password: await (0, hash_security_1.generateHash)(password),
                    confirmEmailOtp: await (0, hash_security_1.generateHash)(String(otp))
                }]
        });
        email_event_1.emailEvent.emit("confirmEmail", { to: email, otp });
        return res.status(201).json({ message: "done", data: { user } });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.UserModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                confirmedAt: { $exists: false }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid account");
        }
        if (!await (0, hash_security_1.comapareHash)(otp, user.confirmEmailOtp)) {
            throw new error_response_1.ConflictException("invalid code");
        }
        await this.UserModel.updateOne({
            filter: { email },
            update: {
                confirmedAt: new Date(),
                $unset: { confirmEmailOtp: 1 }
            }
        });
        return res.status(201).json({ message: "done", data: req.body });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.UserModel.findOne({
            filter: { email }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid email or password");
        }
        if (!user.confirmedAt) {
            throw new error_response_1.BadRequestException("verify your account first");
        }
        if (!await (0, hash_security_1.comapareHash)(password, user.password)) {
            throw new error_response_1.NotFoundException("invalid email or password");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return res.status(200).json({ message: "done", data: { credentials } });
    };
}
exports.default = new AuthenticationService();
