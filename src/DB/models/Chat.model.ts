import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { minLength } from "zod";



export interface IMessage {
    content: string;
    createdBy: Types.ObjectId;

    createdAt?: Date;
    updatedAT?: Date;
}


export type HMessageDocument = HydratedDocument<IMessage>


export interface IChat {
    prticipants: Types.ObjectId[];
    messages: IMessage[];


    group?: string;
    group_image?: string;
    roomId?: string;



    createdBy: Types.ObjectId;
    createdAt?: Date;
    updatedAT?: Date;
}
export type HChatDocument = HydratedDocument<IChat>
const MessageSchema = new Schema<IMessage>({
    content: {
        type: String,
        minLength: 2,
        maxLength: 30000,
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

}, { timestamps: true })

const chatSchema = new Schema<IChat>({
    prticipants: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    ],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    group: { type: String },
    group_image: { type: String },
    roomId: {
        type: String,
        required: function () {
            return this.roomId
        }
    },
    messages: [MessageSchema]

}, { timestamps: true })



export const ChatModel = models.Chat || model<IChat>("Chat", chatSchema);