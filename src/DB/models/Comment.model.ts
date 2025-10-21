import { models, Schema, Types, model, HydratedDocument } from "mongoose";
import { IPost } from "./Post.model";


export interface IComment {
    createdBy: Types.ObjectId;
    postId: Types.ObjectId | Partial<IPost>;
    commentId?: Types.ObjectId;

    content?: string;
    attachments?: string[];

    likes?: Types.ObjectId[];
    tags?: Types.ObjectId[];

    freezedAt?: Date;
    freezedBy?: Types.ObjectId;

    restoredAt?: Date;
    restoredBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        postId: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            required: true
        },
        commentId: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },

        content: {
            type: String,
            minLength: 2,
            maxLength: 4500,
            required: function () {
                return !this.attachments?.length;
            }
        },

        attachments: {
            type: [String],
        },

        likes: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],

        tags: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],

        freezedAt: Date,
        freezedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        restoredAt: Date,
        restoredBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
    },
    {
        timestamps: true,
        strictQuery: true
    }
);




export type HCommentDocument = HydratedDocument<IComment>;
export const CommentModel = models.Comment || model<IComment>("Comment", commentSchema);