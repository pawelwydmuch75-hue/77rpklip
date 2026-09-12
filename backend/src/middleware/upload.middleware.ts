import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const avatarPath = path.join(__dirname, '../../uploads/avatars');
const bannerPath = path.join(__dirname, '../../uploads/banners');
const videoPath = path.join(__dirname, '../../uploads/videos');
const thumbPath = path.join(__dirname, '../../uploads/thumbnails');

[avatarPath, bannerPath, videoPath, thumbPath].forEach(p => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Dozwolone typy obrazów: jpg, png, webp, gif'));
  }
};

const videoFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Dozwolone typy wideo: mp4, webm, ogg, mov, avi'));
  }
};

// Video + thumbnail upload
const videoMulter = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      cb(null, file.fieldname === 'video' ? videoPath : thumbPath);
    },
    filename: (_req, file, cb) => {
      cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
});

export const uploadVideoWithThumbnail = videoMulter.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// Avatar + Banner upload
const profileMulter = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      cb(null, file.fieldname === 'avatar' ? avatarPath : bannerPath);
    },
    filename: (_req, file, cb) => {
      cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadProfileImages = profileMulter.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
]);
