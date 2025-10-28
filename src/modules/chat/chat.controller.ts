import { Router } from "express";
import { validation } from '../../middleware/validation.middleware'
import * as validators from './chat.validation'
import { ChatService } from "./chat.service";
import { authentication } from "../../middleware/authentication.middleware";
import { cloudeFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
const router: Router = Router({ mergeParams: true })

const chatService: ChatService = new ChatService()

router.get("/", authentication(), validation(validators.getChat), chatService.getChat)
router.post("/group", authentication(),
    cloudeFileUpload({ validation: fileValidation.images }).single("attachment")
    , validation(validators.createChattingGroup), chatService.createChattingGroup
)
router.get("/group/:groupId", authentication(),
    cloudeFileUpload({ validation: fileValidation.images }).single("attachment")
    , validation(validators.getChattingGroup), chatService.getChattingGroup)


export default router