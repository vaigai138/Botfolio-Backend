import express from 'express';
import { getPublicProfile } from '../controllers/userController.js';

const router = express.Router();

router.get('/:username', getPublicProfile); // 👈 This matches /api/public/:username

export default router;
