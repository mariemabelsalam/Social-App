import { z } from 'zod';
import { AllowCommentsEnum, AvailabilityEnum, LikeActionEnum } from '../../DB/models/Post.model';
import { generalFields } from './../../middleware/validation.middleware';
import { fileValidation } from '../../utils/multer/cloud.multer';


export const createPost = {
    body: z.strictObject({
        content: z.string().min(2).max(43000).optional(),
        attachments: z.array(generalFields.file(fileValidation.images)).max(2).optional(),
        allowComments: z.enum(AvailabilityEnum).default(AvailabilityEnum.public),
        availability: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.allow),
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





export const updatePost = {
    params: z.strictObject({
        postId: generalFields.id
    }),
    body: z.strictObject({
        content: z.string().min(2).max(43000).optional(),
        allowComments: z.enum(AvailabilityEnum).optional(),
        availability: z.enum(AllowCommentsEnum).optional(),
        attachments: z.array(generalFields.file(fileValidation.images)).max(2).optional(),
        removeAttachments: z.array(z.string()).max(2).optional(),
        tags: z.array(generalFields.id).max(12).optional(),
        removedTags: z.array(generalFields.id).max(12).optional()
    }).superRefine((data, ctx) => {
        if (!Object.values(data)?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "all fields are empty"
            })
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "dublicated tagged user"
            })
        }

          if (data.removedTags?.length && data.removedTags.length !== [...new Set(data.removedTags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["removedTags"],
                message: "dublicated removedTags user"
            })
        }
    })
}






export const likePost = {
    params: z.strictObject({
        postId: generalFields.id
    }),
    query: z.strictObject({
        action: z.enum(LikeActionEnum).default(LikeActionEnum.like)
    })
}