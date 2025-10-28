import { HydratedDocument, Model, ProjectionType, QueryOptions, RootFilterQuery } from "mongoose";
import { DatabaseRepository, lean } from "./database.repository";
import { IChat as TDocument } from '../models/Chat.model'
import { PopulateOptions } from "mongoose";





export class ChatRepository extends DatabaseRepository<TDocument> {
    constructor(protected override readonly model: Model<TDocument>) {
        super(model)
    }

    async findOneChat({
        filter,
        select,
        options,
        page,
        size = 5
    }: {
        filter?: RootFilterQuery<TDocument>,
        select?: ProjectionType<TDocument> | null,
        options?: QueryOptions<TDocument> | null,
        page?: number | undefined
        size?: number | undefined
    }): Promise<lean<TDocument> | HydratedDocument<TDocument> | null> {

        page = Math.floor(!page || page < 1 ? 1 : page);
        size = Math.floor(page < 1 || !size ? 5 : size);


        const doc = this.model.findOne(filter, {
            message: {
                $slice: [-(page * size), size]
            }

        })
        if (options?.lean) {
            doc.lean(options?.lean)
        }
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[])
        }
        return await doc.exec()
    }
}