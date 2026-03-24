import config from '@/config';
import { AppError } from '@/util/error';
import { logger } from '@/util/logger';
import { Request } from 'express';
import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {

    logger.info(`Uploading file: ${file.originalname} with mimetype: ${file.mimetype} and size: ${file.size}`);
    if(config.upload.allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError("Invalid file type", 400))
    }
}

// upload middleware
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
    },
})