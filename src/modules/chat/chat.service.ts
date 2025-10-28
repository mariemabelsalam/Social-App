import { Request, Response } from "express";
import { Types } from "mongoose";
import { v4 as uuid } from 'uuid';
import { UserModel } from "../../DB/models";
import { ChatRepository, UserRepository } from "../../DB/repository";
import { deleteFile, uploadFile } from "../../utils/multer/s3.config";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { successResponse } from "../../utils/response/success.response";
import { connectedSockets } from "../getway";
import { ChatModel } from './../../DB/models/Chat.model';
import { IGetChatResponse } from "./chat.entities";
import { ICreateChattingGroupParamsDTO, IGetChatParamsDTO, IGetChatQueryParamsDTO, IGetChattingGroupParamsDTO, IJoinRoomDTO, ISayHelloDTO, IsendGroupMessageDTO, ISendMessagDTO } from "./chat.tdo";



export class ChatService {

    private userModel: UserRepository = new UserRepository(UserModel)
    private chatModel: ChatRepository = new ChatRepository(ChatModel)
    constructor() { }

    getChat = async (req: Request, res: Response): Promise<Response> => {
        const { userId } = req.params as IGetChatParamsDTO;
        const { page, size }: IGetChatQueryParamsDTO = req.query
        const chat = await this.chatModel.findOneChat({
            filter: {
                prticipants: {
                    $all: [
                        req.user?.id as Types.ObjectId,
                        Types.ObjectId.createFromHexString(userId)
                    ]
                },
                group: { $exists: false }
            },
            options: {
                populate: [{
                    path: "participants",
                    select: "firstName lastName email gender profilePicture"
                }]
            },
            page,
            size
        })

        if (!chat) {
            throw new BadRequestException("fail to find chattin")
        }

        return successResponse<IGetChatResponse>({ res, data: { chat } })
    }
    getChattingGroup = async (req: Request, res: Response): Promise<Response> => {
        const { groupId } = req.params as IGetChattingGroupParamsDTO;
        const { page, size }: IGetChatQueryParamsDTO = req.query
        const chat = await this.chatModel.findOneChat({
            filter: {
                _id: Types.ObjectId.createFromHexString(groupId),
                prticipants: { $in: req.user?.id as Types.ObjectId },
                group: { $exists: true }
            },
            options: {
                populate: [{
                    path: "messages.createdBy",
                    select: "firstName lastName email gender profilePicture"
                }]
            },
            page,
            size
        })

        if (!chat) {
            throw new BadRequestException("fail to find chattin")
        }

        return successResponse<IGetChatResponse>({ res, data: { chat } })
    }

    sayHello = ({ message, socket, callBack, io }: ISayHelloDTO) => {
        try {
            console.log(message);
            callBack ? callBack("hello Back-End to Front-End") : undefined
        } catch (error) {
            return console.log("custom error", error);
        }
    }

    typing = ({ socket, io, receiverId, isTyping }: any) => {
        try {
            const id = socket.credentials?.user._id.toString();
            io.emit("user_typing", { userId: id, isTyping });
        } catch (error) {
            console.log("custom error", error);
        }
    }

    sendMessage = async ({ content, sendTo, socket, io }: ISendMessagDTO) => {
        try {
            const createdBy = socket.credentials?.user._id as Types.ObjectId;
            const user = await this.userModel.findOne({
                filter: {
                    _id: Types.ObjectId.createFromHexString(sendTo),
                    friends: { $in: createdBy }
                }
            })

            if (!user) {
                throw new NotFoundException('invalid')
            }

            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    prticipants: {
                        $all: [
                            createdBy as Types.ObjectId,
                            Types.ObjectId.createFromHexString(sendTo)
                        ]
                    }
                    ,
                    group: { $exists: false }
                },
                update: {
                    $addToSet: { message: { content: createdBy } }
                }
            })


            if (!chat) {
                const [newChat] = await this.chatModel.create({
                    data: [{
                        createdBy,
                        messages: [{ content, createdBy }],
                        prticipants: [
                            createdBy as Types.ObjectId,
                            Types.ObjectId.createFromHexString(sendTo)
                        ]
                    }]
                }) || []

                if (!newChat) {
                    throw new BadRequestException("fail to craete this chat")
                }
            }

            io?.to(
                connectedSockets.get(createdBy.toString() as string) as string[]
            ).emit("successMessage", { content })

            io?.to(
                connectedSockets.get(sendTo) as string[]
            ).emit("newMessage", { content, from: socket.credentials?.user })
        }
        catch (error) {
            return console.log("custom error", error);
        }
    }

    createChattingGroup = async (req: Request, res: Response): Promise<Response> => {
        const { group, participants }: ICreateChattingGroupParamsDTO = req.body
        const dbParticipants = participants.map((participant: string) => {
            return Types.ObjectId.createFromHexString(participant)
        })
        const user = await this.userModel.find({
            filter: {
                _id: { $in: dbParticipants },
                friends: { $in: req.user?._id as Types.ObjectId }
            }
        })
        if (participants.length !== user.length) {
            throw new NotFoundException("some or all recipient are invalid")
        }
        const roomId = group.replace(/\s+/g, "_") + "_" + uuid()
        let group_image: string | undefined;
        if (req.file) {
            group_image = await uploadFile({
                file: req.file as Express.Multer.File,
                path: `chat/${roomId}`
            })
        }
        dbParticipants.push(req.user?._id as Types.ObjectId)

        const [chat] = await this.chatModel.create({
            data: [{
                createdBy: req.user?.id as Types.ObjectId,
                group,
                roomId,
                group_image: group_image as string,
                messages: [],
                prticipants: dbParticipants

            }]
        }) || []

        if (!chat) {
            if (group_image) {
                await deleteFile({ Key: group_image })
            }
            throw new BadRequestException("fail yo generate this group")
        }
        return successResponse<IGetChatResponse>({ res, statusCode: 201, data: { chat } })
    }

    joinRoom = async ({ roomId, socket, io }: IJoinRoomDTO) => {
        try {
            const chat = await this.chatModel.findOne({
                filter: {
                    roomId,
                    group: { $exists: true },
                    prticipants: { $in: socket.credentials?.user._id }
                }
            })
            if (!chat) {
                throw new NotFoundException("fail to find matching room")
            }
            socket.join(chat.roomId as string)

        }
        catch (error) {
            return console.log("custom error", error);
        }
    }

    sendGroupMessage = async ({ content, groupId, socket, io }: IsendGroupMessageDTO) => {
        try {
            const createdBy = socket.credentials?.user._id as Types.ObjectId;
            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    _id: Types.ObjectId.createFromHexString(groupId),
                    prticipants: { $in: createdBy as Types.ObjectId }
                    ,
                    group: { $exists: false }
                },
                update: {
                    $addToSet: { message: { content: createdBy } }
                }
            })


            if (!chat) {
                throw new BadRequestException("fail to find matching room")
            }

            io?.to(
                connectedSockets.get(createdBy.toString() as string) as string[]
            ).emit("successMessage", { content })

            socket?.to(chat.roomId as string).emit("newMessage",
                {
                    content,
                    from: socket.credentials?.user,
                    groupId
                })
        }
        catch (error) {
            return console.log("custom error", error);
        }
    }
}