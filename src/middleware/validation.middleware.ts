
import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";
import { BadRequestException } from "../utils/response/error.response";
import { z } from 'zod'
import { Types } from "mongoose";

export const generalFields = {
    userName: z.string().min(2).max(20),
    email: z.email(),
    password: z.string().min(6).max(20),
    confirmPassword: z.string(),
    otp: z.string().regex(/^\d{6}$/),
    file:function(mimeType:string[]){
        return  z.strictObject({
        fieldName: z.string(),
        originalName: z.string(),
        encoding: z.string(),
        mimeType: z.enum(mimeType),
        buffer: z.any().optional(),
        path:z.string().optional(),
        size: z.number()
    }).refine(data=>{
        return data.buffer || data.path
    },{error:'neither path or buffer is available' , path:['file']})
    },
    id:z.string().refine( (data)=>{
        return Types.ObjectId.isValid(data)
    },{error:"invalid object id format"})
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
            if (req.file) {
                req.body.attachment = req.file
            }
            if (req.files) {
                req.body.attachment = req.files
            }

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
