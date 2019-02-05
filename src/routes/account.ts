import { Router } from 'express';
import * as accountController from '../controllers/accountController';

const router = Router();
router.post('/Register', accountController.register);
router.post('/RegisterExternal', accountController.registerExternal);
router.put('/ForgotPassword', accountController.forgotPassword);
router.put('/ResetPassword', accountController.resetPassword);

export default router;
