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
           this.chatService.typing({socket,io,...data})
        })
    }

}