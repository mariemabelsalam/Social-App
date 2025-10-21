import type { Request, Response } from 'express';
import { successResponse } from '../../utils/response/success.response';
import { PostRepository, UserRepository } from '../../DB/repository';
import { AllowCommentsEnum, CommentModel, HPostDocument, PostModel, UserModel } from '../../DB/models';
import { CommentRepository } from '../../DB/repository/comment.repository';
import { Types } from 'mongoose';
import { postAvailibility } from '../post';
import { BadRequestException, NotFoundException } from '../../utils/response/error.response';
import { deleteFiles, uploadFiles } from '../../utils/multer/s3.config';

class CommentService {
    private userModel = new UserRepository(UserModel);
    private postModel = new PostRepository(PostModel);
    private commentModel = new CommentRepository(CommentModel);
    constructor() { }

    createComment = async (req: Request, res: Response) => {
        const { postId } = req.params as unknown as { postId: Types.ObjectId }

        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowComments: AllowCommentsEnum.allow,
                $or: postAvailibility(req)
            }
        })

        if (!post) {
            throw new NotFoundException("fail to find matching result")
        }

        if (req.body.tags?.length &&
            (
                await this.userModel.find({
                    filter: {
                        _id: {
                            $in: req.body.tags
                        }
                    }
                })
            ).length !== req.body.tags.length
        ) {
            throw new NotFoundException("some of mentioned users not exist")
        }

        let attachments: string[] = []

        if (req.files?.length) {
            attachments = await uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`
            })
        }

        const [comment] = await this.commentModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    postId,
                    createdBy: req.user?._id
                }
            ]
        }) || []

        if (!comment) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments })
            }
            throw new BadRequestException('fail to create this comment')
        }

        return successResponse({ res, statusCode: 201 })

    }

    replyOnComment = async (req: Request, res: Response) => {
        const { postId, commentId } = req.params as unknown as { postId: Types.ObjectId, commentId: Types.ObjectId }

        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                postId,
            },
            options: {
                populate: [
                    {
                        path: "postId",
                        match: {
                            allowComments: AllowCommentsEnum.allow,
                            $or: postAvailibility(req)
                        }
                    }
                ]
            }
        })

        if (!comment?.postId) {
            throw new NotFoundException("fail to find matching result")
        }

        if (req.body.tags?.length &&
            (
                await this.userModel.find({
                    filter: {
                        _id: {
                            $in: req.body.tags
                        }
                    }
                })
            ).length !== req.body.tags.length
        ) {
            throw new NotFoundException("some of mentioned users not exist")
        }

        let attachments: string[] = []

        if (req.files?.length) {
            const post = comment.postId as Partial<HPostDocument>
            attachments = await uploadFiles({

                files: req.files as Express.Multer.File[],
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`
            })
        }

        const [reply] = await this.commentModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    postId,
                    createdBy: req.user?._id
                }
            ]
        }) || []

        if (!comment) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments })
            }
            throw new BadRequestException('fail to create this comment')
        }

        return successResponse({ res, statusCode: 201 })

    }
}

export default new CommentService()