import { z } from 'zod';
import { generalFields } from '../../middleware/validation.middleware';
import { fileValidation } from '../../utils/multer/cloud.multer';

export const getChat = {
    params: z.strictObject({
        userId: generalFields.id
    }),
    query: z.strictObject({
        page: z.coerce.number().int().min(1).optional(),
        size: z.coerce.number().int().min(1).optional(),
    })
}


export const createChattingGroup = {
    body: z.strictObject({
        participants: z.array(generalFields.id).min(1),
        group: z.string().min(2).max(3500),
        attachment: generalFields.file(fileValidation.images)
    }).superRefine((data, ctx) => {

        if (data.participants?.length && data.participants.length !== [...new Set(data.participants)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "dublicated participants user"
            })
        }
    })
}

export const getChattingGroup = {
    params: z.strictObject({
        groupId: generalFields.id
    }),
    query: getChat.query
}