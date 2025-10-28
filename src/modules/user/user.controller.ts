import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import userService from "./user.service";
import { validation } from "../../middleware/validation.middleware";
import * as validators from './user.validation'
import { cloudeFileUpload, fileValidation, storageEnum } from "../../utils/multer/cloud.multer";
import { tokenEnum } from "../../utils/security/token.security";
import { chatRouter } from "../chat";
const router: Router = Router()


router.use("/:userId/chat" , chatRouter)

router.get('/profile', authentication(), userService.profile);
router.patch('/profileImage', authentication(), userService.profileImage);

router.patch('/profileCoverImage', authentication(),
    cloudeFileUpload({ validation: fileValidation.images, storageApproach: storageEnum.disk }).array("images", 2), userService.profileCoverImage
);
router.post('/logout', authentication(), validation(validators.logout), userService.logout);
router.post('/refreshToken', authentication(tokenEnum.refresh), userService.refreshToken);
router.patch('/updatePassword', authentication(), userService.updatePassword);


export default router