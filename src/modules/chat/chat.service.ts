import { ISayHelloDTO } from "./chat.tdo";



export class ChatService {
    constructor() { }

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


}