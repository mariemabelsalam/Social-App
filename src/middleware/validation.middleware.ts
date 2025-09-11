
import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";
import { BadRequestException } from "../utils/response/error.response";
import { z } from 'zod'

export const generalFields = {
    userName: z.string().min(2).max(20),
    email: z.email(),
    password: z.string().min(6).max(20),
    confirmPassword: z.string(),
    otp:z.string().regex(/^\d{6}$/)
} 


type KeyReqType = keyof Request;
type SchemaType = Partial<Record<KeyReqType, ZodType>>;
type validationErrorType = Array<
    {
        key: KeyReqType,
        issues: Array<{ message: string, path: number | string | symbol | undefined }>
    }>


export const validation = (schema: SchemaType) => {
    return (req: Request, res: Response, next: NextFunction): NextFunction => {
        const validationErrors: validationErrorType = [];

        for (const key of Object.keys(schema) as KeyReqType[]) {
            if (!schema[key]) continue;

            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const errors = validationResult.error as ZodError
                validationErrors.push({
                    key, issues: errors.issues.map((issue) => {
                        return { message: issue.message, path: issue.path[0] }
                    })
                })
            }
        }
        if (validationErrors.length) {
            throw new BadRequestException("validation error", { validationErrors })
        }

        return next() as unknown as NextFunction
    }
}
