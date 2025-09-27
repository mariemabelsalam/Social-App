"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodedToken = exports.createLoginCredentials = exports.getSignatures = exports.detectSignatureLevel = exports.verifyToken = exports.generateToken = exports.LogoutEnum = exports.tokenEnum = exports.signatureLevelEnum = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const User_model_1 = require("./../../DB/models/User.model");
const error_response_1 = require("../response/error.response");
const user_repository_1 = require("../../DB/repository/user.repository");
const uuid_1 = require("uuid");
const Token_model_1 = require("../../DB/models/Token.model");
const token_repository_1 = require("../../DB/repository/token.repository");
var signatureLevelEnum;
(function (signatureLevelEnum) {
    signatureLevelEnum["Barear"] = "Barear";
    signatureLevelEnum["System"] = "System";
})(signatureLevelEnum || (exports.signatureLevelEnum = signatureLevelEnum = {}));
var tokenEnum;
(function (tokenEnum) {
    tokenEnum["access"] = "access";
    tokenEnum["refresh"] = "refresh";
})(tokenEnum || (exports.tokenEnum = tokenEnum = {}));
var LogoutEnum;
(function (LogoutEnum) {
    LogoutEnum["only"] = "only";
    LogoutEnum["all"] = "all";
})(LogoutEnum || (exports.LogoutEnum = LogoutEnum = {}));
const generateToken = async ({ payload, secret = process.env.ACCESS_USER_TOKEN_SIGNATURE, options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) } }) => {
    return (0, jsonwebtoken_1.sign)(payload, secret, options);
};
exports.generateToken = generateToken;
const verifyToken = async ({ token, secret = process.env.ACCESS_USER_TOKEN_SIGNATURE, }) => {
    return (0, jsonwebtoken_1.verify)(token, secret);
};
exports.verifyToken = verifyToken;
const detectSignatureLevel = async (role = User_model_1.RoleEnum.user) => {
    let signatureLevel = signatureLevelEnum.Barear;
    switch (role) {
        case User_model_1.RoleEnum.admin:
            signatureLevel = signatureLevelEnum.System;
            break;
        default:
            signatureLevel = signatureLevelEnum.Barear;
            break;
    }
    return signatureLevel;
};
exports.detectSignatureLevel = detectSignatureLevel;
const getSignatures = async (signatureLevel = signatureLevelEnum.Barear) => {
    let signatures = {
        access_signature: "", refresh_signature: ""
    };
    switch (signatureLevel) {
        case signatureLevelEnum.System:
            signatures.access_signature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE;
            signatures.refresh_signature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE;
            break;
        default:
            signatures.access_signature = process.env.ACCESS_USER_TOKEN_SIGNATURE;
            signatures.refresh_signature = process.env.REFRESH_USER_TOKEN_SIGNATURE;
            break;
    }
    return signatures;
};
exports.getSignatures = getSignatures;
const createLoginCredentials = async (user) => {
    const signatureLevel = await (0, exports.detectSignatureLevel)(user.role);
    const signatures = await (0, exports.getSignatures)(signatureLevel);
    const jwtid = (0, uuid_1.v4)();
    const access_token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.access_signature,
        options: {
            expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
            jwtid
        }
    });
    const refresh_token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.refresh_signature,
        options: {
            expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
            jwtid
        }
    });
    return { access_token, refresh_token };
};
exports.createLoginCredentials = createLoginCredentials;
const decodedToken = async ({ authorization, tokenType = tokenEnum.access }) => {
    const userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    const tokenModel = new token_repository_1.TokenRepository(Token_model_1.TokenModel);
    const [barearKey, token] = authorization.split(' ');
    if (!barearKey || !token) {
        throw new error_response_1.UnathorizedException("missing token parts");
    }
    const signatures = await (0, exports.getSignatures)(barearKey);
    const decoded = await (0, exports.verifyToken)({
        token,
        secret: tokenType === tokenEnum.refresh ? signatures.refresh_signature : signatures.access_signature
    });
    if (!decoded?._id || !decoded?.iat) {
        throw new error_response_1.BadRequestException("invalid token");
    }
    if (await tokenModel.findOne({ filter: { jti: decoded.jti } })) {
        throw new error_response_1.UnathorizedException("invalid login");
    }
    const user = await userModel.findOne({
        filter: { _id: decoded._id }
    });
    if (!user) {
        throw new error_response_1.BadRequestException("not register account");
    }
    if (user.changeCredentialsTime?.getTime() || 0 > decoded.iat * 1000) {
        throw new error_response_1.UnathorizedException("invalid login");
    }
    return { user, decoded };
};
exports.decodedToken = decodedToken;
