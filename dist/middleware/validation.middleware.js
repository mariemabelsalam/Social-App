"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = exports.generalFields = void 0;
const error_response_1 = require("../utils/response/error.response");
const zod_1 = require("zod");
exports.generalFields = {
    userName: zod_1.z.string().min(2).max(20),
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6).max(20),
    confirmPassword: zod_1.z.string(),
    otp: zod_1.z.string().regex(/^\d{6}$/)
};
const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const errors = validationResult.error;
                validationErrors.push({
                    key, issues: errors.issues.map((issue) => {
                        return { message: issue.message, path: issue.path[0] };
                    })
                });
            }
        }
        if (validationErrors.length) {
            throw new error_response_1.BadRequestException("validation error", { validationErrors });
        }
        return next();
    };
};
exports.validation = validation;
