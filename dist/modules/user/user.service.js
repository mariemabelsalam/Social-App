"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_security_1 = require("../../utils/security/token.security");
const User_model_1 = require("../../DB/models/User.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const Token_model_1 = require("../../DB/models/Token.model");
const token_repository_1 = require("../../DB/repository/token.repository");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
class UserService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    tokenModel = new token_repository_1.TokenRepository(Token_model_1.TokenModel);
    constructor() { }
    profile = async (req, res) => {
        return res.json({
            message: "done", data: {
                user: req.user?._id,
                decoded: req.decoded?.iat
            }
        });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_security_1.LogoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await this.tokenModel.create({
                    data: [
                        {
                            jti: req.decoded?.jti,
                            expiresIn: req.decoded?.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
                            userId: req.decoded?._id
                        }
                    ]
                });
                statusCode = 201;
                break;
        }
        await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update
        });
        return res.status(statusCode).json({
            message: "done"
        });
    };
    profileImage = async (req, res) => {
        const key = await (0, s3_config_1.uploadFile)({
            storageApproach: cloud_multer_1.storageEnum.disk,
            file: req.file,
            path: `users/${req.decoded?._id}`
        });
        return res.json({
            message: "done",
            data: {
                key
            }
        });
    };
    profileCoverImage = async (req, res) => {
        const urls = (0, s3_config_1.uploadFiles)({
            storageApproach: cloud_multer_1.storageEnum.disk,
            files: req.files,
            path: `user/${req.decoded?._id}/cover`
        });
        return res.json({
            message: "done",
            data: {
                urls
            }
        });
    };
}
exports.default = new UserService();
