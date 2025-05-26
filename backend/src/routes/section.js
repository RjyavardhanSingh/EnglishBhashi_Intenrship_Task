import express from 'express';
import { authenticateUser, authorizeAdmin } from '../middleware/auth.js';
import {
  addSection,
  updateSection,
  deleteSection
} from '../controllers/section.js';

const router = express.Router({ mergeParams: true });

router.use(authenticateUser);

router.post('/', authorizeAdmin, addSection);
router.put('/:sectionId', authorizeAdmin, updateSection);
router.delete('/:sectionId', authorizeAdmin, deleteSection);

export default router;
