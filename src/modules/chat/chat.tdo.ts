import { Server } from "socket.io";
import { IAuthSocket } from "../getway";
import { z } from "zod";
import { createChattingGroup, getChat, getChattingGroup } from "./chat.validation";



export interface IMainDTO {
    socket: IAuthSocket;
    callBack?: any;
    io?: Server
}



export interface ISayHelloDTO extends IMainDTO {
    message: string;

}

export interface ISendMessagDTO extends IMainDTO {
    content: string,
    sendTo: string
}

export interface IJoinRoomDTO extends IMainDTO {
    roomId: string
}

export interface IsendGroupMessageDTO extends IMainDTO {
    content: string,
    groupId: string
}


export type IGetChatParamsDTO = z.infer<typeof getChat.params>
export type IGetChattingGroupParamsDTO = z.infer<typeof getChattingGroup.params>
export type IGetChatQueryParamsDTO = z.infer<typeof getChat.query>
export type ICreateChattingGroupParamsDTO = z.infer<typeof createChattingGroup.body>
