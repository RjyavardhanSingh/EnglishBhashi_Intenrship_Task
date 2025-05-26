import express from 'express';
import { authenticateUser, authorizeAdmin } from '../middleware/auth.js';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
  enrollCourse
} from '../controllers/course.js';
import {
  addSection,
  updateSection,
  deleteSection
} from '../controllers/section.js';
import { addUnit, updateUnit, deleteUnit } from '../controllers/unit.js';
import { addChapter, updateChapter, deleteChapter } from '../controllers/chapter.js';
import Course from '../models/Course.js';
import UserProgress from '../models/UserProgress.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getCourses);
router.get('/:courseId', getCourseById);
router.post('/:courseId/enroll', enrollCourse);

router.get('/:courseId/sections', async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate({
        path: 'sections',
        populate: {
          path: 'units',
          populate: {
            path: 'chapters'
          }
        }
      });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course.sections || []);
  } catch (error) {
    next(error);
  }
});

router.get('/:courseId/enrollment-status', async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    const progress = await UserProgress.findOne({
      userId: req.user._id,
      courseId
    });

    const enrolled = !!progress;

    res.json({ 
      enrolled,
      progress: enrolled ? {
        overallProgress: progress.overallProgress,
        completed: progress.completed,
        lastAccessed: progress.lastAccessed
      } : null
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:courseId/sections', authorizeAdmin, addSection);
router.put('/:courseId/sections/:sectionId', authorizeAdmin, updateSection);
router.delete('/:courseId/sections/:sectionId', authorizeAdmin, deleteSection);

router.post('/:courseId/sections/:sectionId/units', authorizeAdmin, addUnit);
router.put('/:courseId/sections/:sectionId/units/:unitId', authorizeAdmin, updateUnit);
router.delete('/:courseId/sections/:sectionId/units/:unitId', authorizeAdmin, deleteUnit);

router.post('/:courseId/sections/:sectionId/units/:unitId/chapters', authorizeAdmin, addChapter);
router.put('/:courseId/sections/:sectionId/units/:unitId/chapters/:chapterId', authorizeAdmin, updateChapter);
router.delete('/:courseId/sections/:sectionId/units/:unitId/chapters/:chapterId', authorizeAdmin, deleteChapter);

router.post('/', authorizeAdmin, createCourse);
router.put('/:courseId', authorizeAdmin, updateCourse);
router.delete('/:courseId', authorizeAdmin, deleteCourse);
router.patch('/:courseId/publish', authorizeAdmin, publishCourse);

export default router;
