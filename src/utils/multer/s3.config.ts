import { DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, GetObjectAclCommand, GetObjectCommand, GetObjectCommandOutput, ObjectCannedACL, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream } from 'node:fs';
import { v4 as uuid } from 'uuid';
import { BadRequestException } from '../response/error.response';
import { storageEnum } from './cloud.multer';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const s3Config = () => {
    return new S3Client({
        region: process.env.AWS_REGION as string,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
        }
    })
}

export const uploadFile = async ({
    storageApproach = storageEnum.memory,
    Bucket = process.env.BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    file,
}: {
    storageApproach?: storageEnum
    Bucket?: string;
    ACL?: ObjectCannedACL,
    path?: string,
    file: Express.Multer.File,
}): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}_${file.originalname}`,
        Body: storageApproach === storageEnum.memory ? file.buffer : createReadStream(file.path),
        ContentType: file.mimetype,

    })

    await s3Config().send(command)

    if (!command?.input?.Key) {
        throw new BadRequestException("fail to upload key")
    }
    return command.input.Key
}

export const uploadFiles = async ({
    storageApproach = storageEnum.memory,
    Bucket = process.env.BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    files,
}: {
    storageApproach?: storageEnum
    Bucket?: string;
    ACL?: ObjectCannedACL,
    path?: string,
    files: Express.Multer.File[],
}): Promise<string[]> => {
    let urls: string[] = []

    urls = await Promise.all(files.map(file => {
        return uploadFile({
            storageApproach,
            Bucket,
            ACL,
            path,
            file,
        })
    }))

    return urls
}

export const uploadLargeFile = async ({
    storageApproach = storageEnum.disk,
    Bucket = process.env.BUCKET_NAME,
    ACL = "private",
    path = "general",
    file,
}: {
    storageApproach?: storageEnum
    Bucket?: string;
    ACL?: ObjectCannedACL,
    path?: string,
    file: Express.Multer.File,
}): Promise<string> => {

    const upload = new Upload({
        client: s3Config(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}_${file.originalname}`,
            Body: storageApproach === storageEnum.memory ? file.buffer : createReadStream(file.path),
            ContentType: file.mimetype,

        }
    })

    upload.on("httpUploadProgress", (Progress) => {
        console.log(`upload file is ${Progress}`);
    })

    const { Key } = await upload.done();
    if (!Key) {
        throw new BadRequestException("fail to upload key")
    }
    return Key
}

export const createPreSignedUploadLink = async ({
    Bucket = process.env.BUCKET_NAME as string,
    path = "general",
    originalname,
    expiresIn = 120,
    ContentType
}: {
    Bucket?: string;
    path?: string;
    originalname: string
    expiresIn?: number;
    ContentType: string
}): Promise<{ url: string, Key: string }> => {
    const command = new PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}_pre_${originalname}`,
        ContentType
    })
    const url = await getSignedUrl(s3Config(), command, { expiresIn })
    if (!url || !command.input.Key) {
        throw new BadRequestException("fail to create pre signed url")
    }
    return { url, Key: command.input.Key }
}


export const getFile = async ({
    Bucket = process.env.AWS_BACKET_NAME as string,
    Key
}: {
    Bucket?: string;
    Key: string
}): Promise<GetObjectCommandOutput> => {
    const command = new GetObjectCommand({
        Bucket,
        Key
    })
    return await s3Config().send(command)
}

export const createGetPreSignedLink = async ({
    Bucket = process.env.BUCKET_NAME as string,
    Key,
    expiresIn = 120,
    downloadName = "dummy",
    download = "false"
}: {
    Bucket?: string;
    Key: string;
    expiresIn?: number;
    downloadName?: string;
    download?: string
}): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition:
            download === "true" ?
                `attachment;filename="${downloadName || Key.split("/").pop()}"`
                : undefined

    })
    const url = await getSignedUrl(s3Config(), command, { expiresIn })
    if (!url) {
        throw new BadRequestException("fail to create pre signed url")
    }
    return url
}


export const deleteFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key
}: {
    Bucket?: string;
    Key: string
}): Promise<DeleteObjectCommandOutput> => {
    const command = new DeleteObjectCommand({
        Bucket,
        Key,
    })

    return await s3Config().send(command)
}

export const deleteFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    urls,
    Quiet = false
}: {
    Bucket?: string;
    urls: string[];
    Quiet?: boolean
}): Promise<DeleteObjectCommandOutput> => {
    const Objects = urls.map(url => {
        return { Key: url }
    })
    const command = new DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet
        }
    })

    return await s3Config().send(command)
}