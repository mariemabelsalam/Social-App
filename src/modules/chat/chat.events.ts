import { Server } from "socket.io";
import { IAuthSocket } from "../getway";
import { ChatService } from "./chat.service";


export class ChatEvents {
    private chatService: ChatService = new ChatService()
    constructor() { }

    sayHello = (socket: IAuthSocket, io: Server) => {
        socket.on("sayHello", (message: string, callBack) => {
            this.chatService.sayHello({ message, socket, callBack, io })
        })
    }

    type = (socket: IAuthSocket, io: Server) => {
        socket.on("typing", (data) => {
            this.chatService.typing({ socket, io, ...data })
        })
    }

    sendMessage = (socket: IAuthSocket, io: Server) => {
        socket.on("sendMessage", (data: { content: string; sendTo: string }) => {
            this.chatService.sendMessage({ ...data, socket, io })
        })
    }

    joinRoom = (socket: IAuthSocket, io: Server) => {
        socket.on("join_room", (data: { roomId: string }) => {
            this.chatService.joinRoom({ ...data, socket, io })
        })
    }
    sendGroupMessage = (socket: IAuthSocket, io: Server) => {
        socket.on("sendGroupMessage", (data: { content: string, groupId: string }) => {
            this.chatService.sendGroupMessage({ ...data, socket, io })
        })
    }
}