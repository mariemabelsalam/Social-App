"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
const error_response_1 = require("../../utils/response/error.response");
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async find({ filter, select, options }) {
        const doc = this.model.find(filter || {}).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.skip) {
            doc.skip(options.skip);
        }
        if (options?.limit) {
            doc.limit(options.limit);
        }
        if (options?.lean) {
            doc.lean();
        }
        return await doc.exec();
    }
    async findOne({ filter, select, options }) {
        const doc = this.model.findOne(filter).select(select || "");
        if (options?.lean) {
            doc.lean(options?.lean);
        }
        if (options?.populate) {
            doc.populate(options.populate);
        }
        return await doc.exec();
    }
    async findById({ id, select, options }) {
        const doc = this.model.findById(id).select(select || "");
        if (options?.lean) {
            doc.lean(options?.lean);
        }
        if (options?.populate) {
            doc.populate(options.populate);
        }
        return await doc.exec();
    }
    async findByIdAndUpdate({ id, update, options = { new: true } }) {
        return this.model.findByIdAndUpdate(id, { ...update, $inc: { __v: 1 } }, options);
    }
    async updateOne({ filter, update, options }) {
        return this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
    async createUser({ data, options, }) {
        const [user] = await this.create({ data, options }) || [];
        if (!user) {
            throw new error_response_1.BadRequestException("fail to craete this user");
        }
        return user;
    }
    async deleteOne({ filter }) {
        return this.model.deleteOne(filter);
    }
    async deleteMany({ filter }) {
        return this.model.deleteMany(filter);
    }
}
exports.DatabaseRepository = DatabaseRepository;
