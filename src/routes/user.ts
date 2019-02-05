import { Router } from 'express';
import * as userController from '../controllers/userController';
import authorize from '../middleware/authMiddleware';

const router = Router();
router.all('*', authorize(['System Administrator', 'User Administrator']));
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);
router.put('/:id/Lock', userController.lockUser);
router.put('/:id/Unlock', userController.unlockUser);
router.delete('/:id', userController.deleteUser);

export default router;
