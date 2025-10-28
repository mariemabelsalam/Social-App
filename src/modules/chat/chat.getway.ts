import { Server, Socket } from "socket.io"
import { IAuthSocket } from "../getway";
import { ChatEvents } from "./chat.events";

export class ChatGetway {
    private chatEvents: ChatEvents = new ChatEvents()
    constructor() { }

    register = (socket: IAuthSocket, io: Server) => {
        this.chatEvents.sayHello(socket, io)
        this.chatEvents.type(socket, io)
        this.chatEvents.sendMessage(socket, io)
        this.chatEvents.joinRoom(socket, io)
    }

}