import express from 'express';
import { authenticateUser, authorizeAdmin } from '../middleware/auth.js';
import {
  addChapter,
  updateChapter,
  deleteChapter,
  submitChapterAnswer
} from '../controllers/chapter.js';

const router = express.Router({ mergeParams: true });

router.use(authenticateUser);

router.post('/:chapterId/questions/:questionId/submit', submitChapterAnswer);

router.post('/', authorizeAdmin, addChapter);
router.put('/:chapterId', authorizeAdmin, updateChapter);
router.delete('/:chapterId', authorizeAdmin, deleteChapter);

export default router;
