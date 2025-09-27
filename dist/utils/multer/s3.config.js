"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLargeFile = exports.uploadFiles = exports.uploadFile = exports.s3Config = void 0;
const cloud_multer_1 = require("./cloud.multer");
const client_s3_1 = require("@aws-sdk/client-s3");
const node_fs_1 = require("node:fs");
const uuid_1 = require("uuid");
const error_response_1 = require("../response/error.response");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3Config = () => {
    return new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });
};
exports.s3Config = s3Config;
const uploadFile = async ({ storageApproach = cloud_multer_1.storageEnum.memory, Bucket = process.env.BUCKET_NAME, ACL = "private", path = "general", file, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APLLICATION_NAME}/${path}/${(0, uuid_1.v4)()}_${file.originalname}`,
        Body: storageApproach === cloud_multer_1.storageEnum.memory ? file.buffer : (0, node_fs_1.createReadStream)(file.path),
        ContentType: file.mimetype,
    });
    await (0, exports.s3Config)().send(command);
    if (!command?.input?.Key) {
        throw new error_response_1.BadRequestException("fail to upload key");
    }
    return command.input.Key;
};
exports.uploadFile = uploadFile;
const uploadFiles = async ({ storageApproach = cloud_multer_1.storageEnum.memory, Bucket = process.env.BUCKET_NAME, ACL = "private", path = "general", files, }) => {
    let urls = [];
    urls = await Promise.all(files.map(file => {
        return (0, exports.uploadFile)({
            storageApproach,
            Bucket,
            ACL,
            path,
            file,
        });
    }));
    return urls;
};
exports.uploadFiles = uploadFiles;
const uploadLargeFile = async ({ storageApproach = cloud_multer_1.storageEnum.disk, Bucket = process.env.BUCKET_NAME, ACL = "private", path = "general", file, }) => {
    const upload = new lib_storage_1.Upload({
        client: (0, exports.s3Config)(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APLLICATION_NAME}/${path}/${(0, uuid_1.v4)()}_${file.originalname}`,
            Body: storageApproach === cloud_multer_1.storageEnum.memory ? file.buffer : (0, node_fs_1.createReadStream)(file.path),
            ContentType: file.mimetype,
        }
    });
    upload.on("httpUploadProgress", (Progress) => {
        console.log(`upload file is ${Progress}`);
    });
    const { Key } = await upload.done();
    if (!Key) {
        throw new error_response_1.BadRequestException("fail to upload key");
    }
    return Key;
};
exports.uploadLargeFile = uploadLargeFile;
