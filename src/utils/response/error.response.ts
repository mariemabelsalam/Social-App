import { NextFunction, Request, Response } from "express"

export interface IError extends Error {
    statusCode: number
}


export class ApllicationError extends Error {
    constructor(message: string, public statusCode: number = 400, cause: unknown) {
        super(message, { cause });
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor)
    }
}


export class BadRequestException extends ApllicationError {
    constructor(message: string, cause?: unknown) {
        super(message, 400, cause);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor)
    }
}


export class NotFoundException extends ApllicationError {
    constructor(message: string, cause?: unknown) {
        super(message, 404, cause);
    }
}

export class ConflictException extends ApllicationError {
    constructor(message: string, cause?: unknown) {
        super(message, 409, cause);
    }
}


export const globalErrorHandling = (error: IError, req: Request, res: Response, next: NextFunction) => {
    return res.status(error.statusCode || 500).json({
        err_message: error.message || "something went wrong ",
        satck: process.env.MOOD === 'development' ? error.stack : undefined, error
    })
}