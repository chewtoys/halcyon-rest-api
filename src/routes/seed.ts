import { Router } from 'express';
import * as seedController from '../controllers/seedController';

const router = Router();
router.get('/', seedController.seedData);

export default router;
