import { z } from 'zod';
import { generalFields } from './../../middleware/validation.middleware';
import { fileValidation } from '../../utils/multer/cloud.multer';


export const createComment = {
    params: z.strictObject({ postId: generalFields.id }),
    body: z.strictObject({
        content: z.string().min(2).max(43000).optional(),
        attachments: z.array(generalFields.file(fileValidation.images)).max(2).optional(),
        tags: z.array(generalFields.id).max(12).optional()
    }).superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "sorry we cant make post without content and attachments"
            })
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "dublicated tagged user"
            })
        }
    })
}




export const replyOnComment= {
    params: createComment.params.extend({
        commentId: generalFields.id
    }),
    body: createComment.body
}
