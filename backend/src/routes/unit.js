import express from 'express';
import { authenticateUser, authorizeAdmin } from '../middleware/auth.js';
import {
  addUnit,
  updateUnit,
  deleteUnit
} from '../controllers/unit.js';

const router = express.Router({ mergeParams: true });

router.use(authenticateUser);

router.post('/', authorizeAdmin, addUnit);
router.put('/:unitId', authorizeAdmin, updateUnit);
router.delete('/:unitId', authorizeAdmin, deleteUnit);

export default router;
