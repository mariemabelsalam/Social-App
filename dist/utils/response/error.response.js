"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenException = exports.UnathorizedException = exports.globalErrorHandling = exports.ConflictException = exports.NotFoundException = exports.BadRequestException = exports.ApllicationError = void 0;
class ApllicationError extends Error {
    statusCode;
    constructor(message, statusCode = 400, cause) {
        super(message, { cause });
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApllicationError = ApllicationError;
class BadRequestException extends ApllicationError {
    constructor(message, cause) {
        super(message, 400, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.BadRequestException = BadRequestException;
class NotFoundException extends ApllicationError {
    constructor(message, cause) {
        super(message, 404, cause);
    }
}
exports.NotFoundException = NotFoundException;
class ConflictException extends ApllicationError {
    constructor(message, cause) {
        super(message, 409, cause);
    }
}
exports.ConflictException = ConflictException;
const globalErrorHandling = (error, req, res, next) => {
    return res.status(error.statusCode || 500).json({
        err_message: error.message || "something went wrong ",
        satck: process.env.MOOD === 'development' ? error.stack : undefined, error
    });
};
exports.globalErrorHandling = globalErrorHandling;
class UnathorizedException extends ApllicationError {
    constructor(message, cause) {
        super(message, 401, cause);
    }
}
exports.UnathorizedException = UnathorizedException;
class ForbiddenException extends ApllicationError {
    constructor(message, cause) {
        super(message, 403, cause);
    }
}
exports.ForbiddenException = ForbiddenException;
