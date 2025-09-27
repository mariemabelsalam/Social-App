import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { BadRequestException } from '../response/error.response';
import os from 'node:os';
import { v4 as uuid } from 'uuid';

export enum storageEnum {
    memory = "memory",
    disk = "disk"
}

export const fileValidation = {
    images: ['image/jpeg', 'image/gif', 'image/jpg', 'image/png']
}


export const cloudeFileUpload = ({
    validation = [],
    storageApproach = storageEnum.memory,
    maxSizeMB = 2
}: {
    validation?: string[],
    storageApproach?: storageEnum,
    maxSizeMB?: number
}): multer.Multer => {
    const storage = storageApproach === storageEnum.memory ? multer.memoryStorage()
        : multer.diskStorage({
            destination: os.tmpdir(),
            filename: function (req: Request, file: Express.Multer.File, callback) {
                callback(null, `${uuid()}_${file.originalname}`)
            },
        })

    function fileFilter(
        req: Request,
        file: Express.Multer.File,
        callback: FileFilterCallback

    ) {
        if (!validation.includes(file.mimetype)) {
            return callback(new BadRequestException("validatin error", {
                validationErrors: [{ key: "file", issues: [{ path: "file", message: "invalid format" }] }]
            }))
        }

        return callback(null, true)
    }

    return multer({ fileFilter, limits: { fileSize: maxSizeMB * 1024 * 1024 }, storage })
}