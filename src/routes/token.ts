import { Router } from 'express';
import * as tokenController from '../controllers/tokenController';

const router = Router();
router.post('/', tokenController.getToken);

export default router;
