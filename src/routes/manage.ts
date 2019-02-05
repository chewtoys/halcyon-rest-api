import { Router } from 'express';
import * as manageController from '../controllers/manageController';
import authorize from '../middleware/authMiddleware';

const router = Router();
router.all('*', authorize());
router.get('/', manageController.getProfile);
router.put('/', manageController.updateProfile);
router.put('/VerifyEmail', manageController.verifyEmail);
router.put('/ConfirmEmail', manageController.confirmEmail);
router.put('/ChangePassword', manageController.changePassword);
router.put('/SetPassword', manageController.setPassword);
router.post('/Login', manageController.addLogin);
router.delete('/Login', manageController.removeLogin);
router.get('/TwoFactor', manageController.getTwoFactorConfig);
router.post('/TwoFactor', manageController.enableTwoFactor);
router.delete('/TwoFactor', manageController.disableTwoFactor);
router.delete('/', manageController.deleteAccount);

export default router;
