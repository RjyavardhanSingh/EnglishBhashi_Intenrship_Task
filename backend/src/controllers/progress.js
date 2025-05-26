import UserProgress from '../models/UserProgress.js';
import Course from '../models/Course.js';
import { generateError } from '../utils/index.js';

const calculateOverallProgress = async (courseId, sectionsProgress) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) return 0;
    
    let totalChapters = 0;
    let completedChapters = 0;

    course.sections.forEach((section, sIndex) => {
      section.units.forEach((unit, uIndex) => {
        const chapterCount = unit.chapters.length;
        totalChapters += chapterCount;
      });
    });

    course.sections.forEach((section, sIndex) => {
      section.units.forEach((unit, uIndex) => {
        unit.chapters.forEach((chapter, cIndex) => {
          const isCompleted = sectionsProgress?.some(sp => 
            sp.sectionId.equals(section._id) && 
            sp.unitsProgress?.some(up => 
              up.unitId.equals(unit._id) &&
              up.chaptersProgress?.some(cp => 
                cp.chapterId.equals(chapter._id) && cp.completed === true
              )
            )
          );
          
          if (isCompleted) {
            completedChapters++;
          }
        });
      });
    });

    const percentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    
    return Math.min(percentage, 100);
  } catch (error) {
    console.error('Error calculating progress:', error);
    return 0;
  }
};

export const getUserProgress = async (req, res, next) => {
  try {
    const progressList = await UserProgress.find({ userId: req.user._id })
      .populate('courseId', 'title description coverImage');

    const progressWithCalculation = await Promise.all(
      progressList.map(async (p) => {
        const overallProgress = await calculateOverallProgress(
          p.courseId._id,
          p.sectionsProgress
        );
        
        p.overallProgress = overallProgress;
        p.completed = overallProgress === 100;
        
        await p.save();
        
        return p;
      })
    );

    res.json(progressWithCalculation);
  } catch (error) {
    next(error);
  }
};

export const getCourseProgress = async (req, res, next) => {
  try {
    const progress = await UserProgress.findOne({
      userId: req.user._id,
      courseId: req.params.courseId,
    }).populate('courseId', 'title description coverImage');

    if (!progress) {
      throw generateError('Progress not found', 404);
    }

    const overallProgress = await calculateOverallProgress(
      progress.courseId._id,
      progress.sectionsProgress
    );
    
    progress.overallProgress = overallProgress;
    progress.completed = overallProgress === 100;
    
    await progress.save();
    
    res.json(progress);
  } catch (error) {
    next(error);
  }
};

export const updateUserProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;
    
    let progress = await UserProgress.findOne({
      userId: req.user._id,
      courseId
    });

    if (!progress) {
      return res.status(404).json({ 
        message: 'Progress not found. User is not enrolled in this course.' 
      });
    }

    if (updateData.currentChapter) {
      progress.currentChapter = updateData.currentChapter;
    }

    progress.lastAccessed = new Date();
    await progress.save();

    res.json({
      message: 'Progress updated successfully',
      progress: {
        courseId: progress.courseId,
        overallProgress: progress.overallProgress,
        completed: progress.completed,
        currentChapter: progress.currentChapter
      }
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    next(error);
  }
};
