import { models, Schema, Types, model, HydratedDocument } from "mongoose";

export enum AllowCommentsEnum {
    allow = "allow",
    deny = "deny"
}
export enum AvailabilityEnum {
    public = "public",
    friends = "friends",
    onlyMe = "onlyMe"
}

export enum LikeActionEnum {
    like = "like",
    unlike = "unlike",
}

export interface IPost {
    content?: string;
    attachments?: string[];
    assetsFolderId: string;
    allowComments: AllowCommentsEnum;
    availability: AvailabilityEnum;
    likes?: Types.ObjectId[];
    tags?: Types.ObjectId[];
    createdBy: Types.ObjectId;
    freezedAt?: Date;
    freezedBy?: Types.ObjectId;
    restoredAt?: Date;
    restoredBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new Schema<IPost>(
    {
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
        assetsFolderId: {
            type: String,
            required: true,
        },
        availability: {
            type: String,
            enum: AvailabilityEnum,
            default: AvailabilityEnum.public
        },
        allowComments: {
            type: String,
            enum: AllowCommentsEnum,
            default: AllowCommentsEnum.allow
        },
        likes: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        tags: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
       
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


postSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, freezedAt: { $exists: false } })
    }
    next()
})


postSchema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, freezedAt: { $exists: false } })
    }

    next()
})


export type HPostDocument = HydratedDocument<IPost>;
export const PostModel = models.Post || model<IPost>("Post", postSchema);