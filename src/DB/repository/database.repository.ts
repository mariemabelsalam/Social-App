import { CreateOptions, DeleteResult, FlattenMaps, HydratedDocument, Model, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery, Types, UpdateQuery, UpdateWriteOpResult } from "mongoose";
import { BadRequestException } from "../../utils/response/error.response";
import { optional } from "zod";

export type lean<T> = HydratedDocument<FlattenMaps<T>>;


export abstract class DatabaseRepository<TDocument> {
    constructor(protected readonly model: Model<TDocument>) { }

    async find({
        filter,
        select,
        options
    }: {
        filter?: RootFilterQuery<TDocument>,
        select?: ProjectionType<TDocument> | undefined,
        options?: QueryOptions<TDocument> | undefined,
    }): Promise<lean<TDocument>[] | HydratedDocument<TDocument>[] | []> {
        const doc = this.model.find(filter || {}).select(select || "")
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[])
        }
        if (options?.skip) {
            doc.skip(options.skip)
        }
        if (options?.limit) {
            doc.limit(options.limit)
        }
        if (options?.lean) {
            doc.lean()
        }

        return await doc.exec()
    }

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

    async findById({
        id, select, options
    }: {
        id: Types.ObjectId,
        select?: ProjectionType<TDocument>,
        options?: QueryOptions<TDocument> | null,
    }): Promise<lean<TDocument> | HydratedDocument<TDocument> | null> {
        const doc = this.model.findById(id).select(select || "")
        if (options?.lean) {
            doc.lean(options?.lean)
        }
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[])
        }
        return await doc.exec()
    }

    async findByIdAndUpdate({
        id, update, options = { new: true }
    }: {
        id: Types.ObjectId,
        update?: UpdateQuery<TDocument>,
        options?: QueryOptions<TDocument> | null,
    }): Promise<lean<TDocument> | HydratedDocument<TDocument> | null> {
        return this.model.findByIdAndUpdate(id,
            { ...update, $inc: { __v: 1 } },
            options
        )
    }

    async findOneAndUpdate({
        filter, update, options = { new: true }
    }: {
        filter?: RootFilterQuery<TDocument>,
        update?: UpdateQuery<TDocument>,
        options?: QueryOptions<TDocument> | null,
    }): Promise<lean<TDocument> | HydratedDocument<TDocument> | null> {
        return this.model.findOneAndUpdate(filter,
            { ...update, $inc: { __v: 1 } },
            options
        )
    }

    async updateOne({ filter, update, options }: {
        filter: RootFilterQuery<TDocument>,
        update: UpdateQuery<TDocument>,
        options?: MongooseUpdateQueryOptions<TDocument> | null
    }): Promise<UpdateWriteOpResult> {
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: { $add: ["$__v", 1] },
                }
            })
            return this.model.updateOne(filter || {}, update, options)
        }
        return this.model.updateOne(filter || {}, { ...update, $inc: { __v: 1 } }, options)
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

    async deleteOne({
        filter
    }: {
        filter: RootFilterQuery<TDocument>
    }): Promise<DeleteResult> {
        return this.model.deleteOne(filter)
    }

    async deleteMany({
        filter
    }: {
        filter: RootFilterQuery<TDocument>
    }): Promise<DeleteResult> {
        return this.model.deleteMany(filter)
    }


    async paginate({
        filter = {},
        select,
        options = {},
        page = 1,
        size = 5
    }: {
        filter?: RootFilterQuery<TDocument>,
        select?: ProjectionType<TDocument> | undefined,
        options?: QueryOptions<TDocument> | undefined,
        page?: number | 'all',
        size?: number,
    }): Promise<lean<TDocument>[] | HydratedDocument<TDocument>[] | [] | any> {
        let docsCount: number | undefined = undefined;
        let pages: number | undefined = undefined;
        if (page !== "all") {
            page = Math.floor(page < 1 ? 1 : page);
            options.limit = Math.floor(page < 1 || !size ? 5 : size);
            options.skip = (page - 1) * options.limit
            docsCount = await this.model.countDocuments(filter);
            pages = Math.ceil(docsCount / options.limit)
        }
        const result = await this.find({ filter, select, options })
        return {
            result, docsCount, limit: options.limit, pages,
            currentPage: page !== "all" ? page : undefined
        }
    }
}