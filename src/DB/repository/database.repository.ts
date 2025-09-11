import { CreateOptions, FlattenMaps, HydratedDocument, Model, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery, UpdateQuery, UpdateWriteOpResult } from "mongoose";
import { BadRequestException } from "../../utils/response/error.response";

export type lean<T> = HydratedDocument<FlattenMaps<T>>;


export abstract class DatabaseRepository<TDocument> {
    constructor(protected readonly model: Model<TDocument>) { }

    async findOne({
        filter,
        select,
        options
    }: {
        filter?: RootFilterQuery<TDocument>,
        select?: ProjectionType<TDocument> | null,
        options?: QueryOptions<TDocument> | null,
    }): Promise<lean<TDocument> | HydratedDocument<TDocument> | null> {
        const doc = this.model.findOne(filter).select(select || "")
        if (options?.lean) {
            doc.lean(options?.lean)
        }
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[])
        }
        return await doc.exec()
    }

    async updateOne({ filter, update, options }: {
        filter: RootFilterQuery<TDocument>,
        update: UpdateQuery<TDocument>,
        options?: MongooseUpdateQueryOptions<TDocument> | null
    }): Promise<UpdateWriteOpResult>{
        return this.model.updateOne(filter,{...update , $inc:{__v:1}}, options)
    }

    async create({
        data,
        options,
    }: {
        data: Partial<TDocument>[];
        options?: CreateOptions | undefined
    }): Promise<HydratedDocument<TDocument>[] | undefined> {
        return await this.model.create(data, options)
    }

    async createUser({
        data,
        options,
    }: {
        data: Partial<TDocument>[];
        options?: CreateOptions
    }): Promise<HydratedDocument<TDocument>> {
        const [user] = await this.create({ data, options }) || [];
        if (!user) {
            throw new BadRequestException("fail to craete this user")
        }
        return user
    }
}