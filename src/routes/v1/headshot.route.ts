import { headshotController } from "@/controllers";
import { authenticate, upload, validate } from "@/middleware";
import { uploadPhotoSchema } from "@/validator/headshot.validator";
import { Router } from "express";

const router = Router();

// all are protected routes

router.use(authenticate)

// get available styles for headshot

router.get('/styles', headshotController.getAvailableStyles);

// Generate headshot
router.post('/generate', upload.single('photo'), validate(uploadPhotoSchema), headshotController.generateHeadshot);

// Get headshots
router.get('/', headshotController.getHeadshots);

// Delete headshot
router.delete('/:id', headshotController.deleteHeadshot);


export default router;