import { Router } from "express";
import { validation } from '../../middleware/validation.middleware'
import * as validators from './comments.validation'
import commentService from "./comments.services";
import { authentication } from "../../middleware/authentication.middleware";
import { cloudeFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
const router: Router = Router({ mergeParams: true })


router.post('/', authentication(),
    cloudeFileUpload({ validation: fileValidation.images }).array("attachments", 2),
    validation(validators.createComment),
    commentService.createComment
)

router.post('/:commentId/reply', authentication(),
    cloudeFileUpload({ validation: fileValidation.images }).array("attachments", 2),
    validation(validators.replyOnComment),
    commentService.replyOnComment
)

export default router