import { authentication } from './../../middleware/authentication.middleware';
import { Router } from "express";
import { postService } from "./post.service";
import { cloudeFileUpload, fileValidation } from '../../utils/multer/cloud.multer';
import { validation } from '../../middleware/validation.middleware';
import * as validators from './post.validation'
import { commentRouter } from '../comment';

const router: Router = Router()


router.use("/:postId/comment" , commentRouter)

router.get('/' , authentication() , postService.postList)

router.get('/createPost', authentication(),
    cloudeFileUpload({ validation: fileValidation.images }).array("attachment", 2),
    validation(validators.createPost),
    postService.createPost);


router.patch('/:postId', authentication(),
    cloudeFileUpload({ validation: fileValidation.images }).array("attachment", 2),
    validation(validators.updatePost), postService.updatePost)


router.patch('/:postId/like', authentication(), validation(validators.likePost), postService.likePost)



export default router