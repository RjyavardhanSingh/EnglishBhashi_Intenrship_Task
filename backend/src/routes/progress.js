import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  getUserProgress,
  getCourseProgress,
  updateUserProgress
} from '../controllers/progress.js';
import Course from '../models/Course.js';
import UserProgress from '../models/UserProgress.js';
import { generateError } from '../utils/index.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getUserProgress);
router.get('/:courseId', getCourseProgress);
router.put('/:courseId', updateUserProgress);

// Quiz submission route
router.post('/quiz', async (req, res, next) => {
  try {
    const { chapterId, answers } = req.body;

    // Find the course that contains this chapter
    const course = await Course.findOne({
      'sections.units.chapters._id': chapterId
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found for this chapter' });
    }

    // Find the specific chapter and get its questions
    let targetChapter = null;
    let sectionId = null;
    let unitId = null;

    for (const section of course.sections) {
      for (const unit of section.units) {
        for (const chapter of unit.chapters) {
          if (chapter._id.toString() === chapterId) {
            targetChapter = chapter;
            sectionId = section._id;
            unitId = unit._id;
            break;
          }
        }
        if (targetChapter) break;
      }
      if (targetChapter) break;
    }

    if (!targetChapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    if (!targetChapter.questions || targetChapter.questions.length === 0) {
      return res.status(404).json({ message: 'No questions found in this chapter' });
    }

    // Check if user is enrolled
    const progress = await UserProgress.findOne({
      userId: req.user._id,
      courseId: course._id
    });

    if (!progress) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Calculate quiz results for all questions
    const results = [];
    let correctCount = 0;

    targetChapter.questions.forEach((question, index) => {
      const userAnswer = answers[question._id.toString()];
      const isCorrect = userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

      if (isCorrect) correctCount++;

      results.push({
        questionId: question._id,
        userAnswer: userAnswer || '',
        isCorrect: isCorrect,
        correctAnswer: question.correctAnswer
      });
    });

    const score = targetChapter.questions.length > 0
      ? Math.round((correctCount / targetChapter.questions.length) * 100)
      : 0;

    const passed = score >= 60; // 60% passing grade

    // Update progress - prevent duplicate chapter entries
    let sectionProgress = progress.sectionsProgress.find(sp =>
      sp.sectionId.equals(sectionId)
    );

    if (!sectionProgress) {
      sectionProgress = {
        sectionId: sectionId,
        completed: false,
        unitsProgress: []
      };
      progress.sectionsProgress.push(sectionProgress);
    }

    let unitProgress = sectionProgress.unitsProgress.find(up =>
      up.unitId.equals(unitId)
    );

    if (!unitProgress) {
      unitProgress = {
        unitId: unitId,
        completed: false,
        chaptersProgress: []
      };
      sectionProgress.unitsProgress.push(unitProgress);
    }

    let chapterProgress = unitProgress.chaptersProgress.find(cp =>
      cp.chapterId.equals(chapterId)
    );

    if (!chapterProgress) {
      chapterProgress = {
        chapterId: chapterId,
        completed: false,
        questionsProgress: [],
        score: 0,
        lastAttempted: new Date()
      };
      unitProgress.chaptersProgress.push(chapterProgress);
    }

    // Update chapter progress with all questions
    chapterProgress.questionsProgress = results.map(result => ({
      questionId: result.questionId,
      userAnswer: result.userAnswer,
      isCorrect: result.isCorrect,
      attemptedAt: new Date()
    }));

    // Update score regardless of pass/fail
    chapterProgress.score = score;
    chapterProgress.lastAttempted = new Date();

    // Only mark as completed if passed
    if (passed) {
      chapterProgress.completed = true;
    }

    // Recalculate progress using the corrected function
    progress.overallProgress = calculateOverallProgress(course, progress);
    progress.completed = progress.overallProgress === 100;
    progress.lastAccessed = new Date();
    await progress.save();

    res.json({
      score: score,
      passed: passed,
      results: results,
      totalQuestions: targetChapter.questions.length,
      correctAnswers: correctCount,
      progress: {
        chapterProgress: chapterProgress,
        overallProgress: progress.overallProgress,
        courseCompleted: progress.completed
      }
    });

  } catch (error) {
    console.error('Quiz submission error:', error);
    next(error);
  }
});

// Debug route to check and fix progress calculation for all courses
router.post('/debug/recalculate-all', async (req, res, next) => {
  try {
    // Get all user progress records
    const allProgress = await UserProgress.find({ userId: req.user._id });
    const results = [];

    for (const progress of allProgress) {
      const course = await Course.findById(progress.courseId);
      if (!course) {
        continue;
      }

      const oldProgress = progress.overallProgress;
      const newProgress = calculateOverallProgress(course, progress);

      progress.overallProgress = newProgress;
      progress.completed = newProgress === 100;
      await progress.save();

      results.push({
        courseTitle: course.title,
        courseId: course._id,
        oldProgress,
        newProgress,
        sectionsCount: course.sections.length,
        totalChapters: course.sections.reduce((acc, section) =>
          acc + section.units.reduce((unitAcc, unit) => unitAcc + unit.chapters.length, 0), 0
        ),
        completedChapters: progress.sectionsProgress?.reduce((acc, sp) =>
          acc + (sp.unitsProgress?.reduce((unitAcc, up) =>
            unitAcc + (up.chaptersProgress?.filter(cp => cp.completed).length || 0), 0) || 0), 0) || 0
      });
    }

    res.json({
      message: 'Progress recalculated for all courses',
      results
    });

  } catch (error) {
    console.error('Debug recalculate error:', error);
    next(error);
  }
});

// Replace the calculateOverallProgress function with this corrected version:

const calculateOverallProgress = (course, progress) => {
  let totalChapters = 0;
  let completedChapters = 0;

  // Count all chapters in the course structure (the TRUE total)
  course.sections.forEach((section, sIndex) => {
    section.units.forEach((unit, uIndex) => {
      const chapterCount = unit.chapters.length;
      totalChapters += chapterCount;
    });
  });

  // Count completed chapters by checking which course chapters are marked as completed
  course.sections.forEach((section, sIndex) => {
    section.units.forEach((unit, uIndex) => {
      unit.chapters.forEach((chapter, cIndex) => {
        // Find if this specific chapter is completed in user progress
        const isCompleted = progress.sectionsProgress?.some(sp =>
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

  // Ensure percentage never exceeds 100%
  return Math.min(percentage, 100);
};

// Mark chapter as completed route
router.post('/complete-chapter', async (req, res, next) => {
  try {
    const { chapterId } = req.body;

    // Find the course that contains this chapter
    const course = await Course.findOne({
      'sections.units.chapters._id': chapterId
    }).populate('sections.units.chapters');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the specific chapter, section, and unit
    let targetChapter = null;
    let sectionId = null;
    let unitId = null;

    for (const section of course.sections) {
      for (const unit of section.units) {
        for (const chapter of unit.chapters) {
          if (chapter._id.toString() === chapterId) {
            targetChapter = chapter;
            sectionId = section._id;
            unitId = unit._id;
            break;
          }
        }
        if (targetChapter) break;
      }
      if (targetChapter) break;
    }

    if (!targetChapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    // Find user progress
    let progress = await UserProgress.findOne({
      userId: req.user._id,
      courseId: course._id
    });

    if (!progress) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Find or create section progress
    let sectionProgress = progress.sectionsProgress.find(sp =>
      sp.sectionId.equals(sectionId)
    );

    if (!sectionProgress) {
      sectionProgress = {
        sectionId: sectionId,
        completed: false,
        unitsProgress: []
      };
      progress.sectionsProgress.push(sectionProgress);
    }

    // Find or create unit progress
    let unitProgress = sectionProgress.unitsProgress.find(up =>
      up.unitId.equals(unitId)
    );

    if (!unitProgress) {
      unitProgress = {
        unitId: unitId,
        completed: false,
        chaptersProgress: []
      };
      sectionProgress.unitsProgress.push(unitProgress);
    }

    // Find or create chapter progress
    let chapterProgress = unitProgress.chaptersProgress.find(cp =>
      cp.chapterId.equals(chapterId)
    );

    if (!chapterProgress) {
      chapterProgress = {
        chapterId: chapterId,
        completed: false,
        score: 0,
        lastAttempted: new Date()
      };
      unitProgress.chaptersProgress.push(chapterProgress);
    }

    // Mark chapter as completed
    chapterProgress.completed = true;
    chapterProgress.score = 100;
    chapterProgress.lastAttempted = new Date();

    // Update unit completion
    const totalChaptersInUnit = unitProgress.chaptersProgress.length;
    const completedChaptersInUnit = unitProgress.chaptersProgress.filter(cp => cp.completed).length;
    unitProgress.completed = totalChaptersInUnit > 0 && totalChaptersInUnit === completedChaptersInUnit;

    // Update section completion
    const totalUnitsInSection = sectionProgress.unitsProgress.length;
    const completedUnitsInSection = sectionProgress.unitsProgress.filter(up => up.completed).length;
    sectionProgress.completed = totalUnitsInSection > 0 && totalUnitsInSection === completedUnitsInSection;

    // Recalculate progress using the corrected function
    progress.overallProgress = calculateOverallProgress(course, progress);
    progress.completed = progress.overallProgress === 100;
    progress.lastAccessed = new Date();

    await progress.save();

    res.json({
      completed: true,
      progress: {
        chapterProgress: chapterProgress,
        overallProgress: progress.overallProgress,
        courseCompleted: progress.completed
      }
    });

  } catch (error) {
    console.error('Mark chapter completed error:', error);
    next(error);
  }
});

// Answer submission route
router.post('/answer', async (req, res, next) => {
  try {
    const { chapterId, answer } = req.body;

    // Find the course that contains this chapter
    const course = await Course.findOne({
      'sections.units.chapters._id': chapterId
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found for this chapter' });
    }

    // Find the specific chapter and get its question
    let targetChapter = null;
    let sectionId = null;
    let unitId = null;
    let questionId = null;

    for (const section of course.sections) {
      for (const unit of section.units) {
        for (const chapter of unit.chapters) {
          if (chapter._id.toString() === chapterId) {
            targetChapter = chapter;
            sectionId = section._id;
            unitId = unit._id;
            // Get the first question for simplicity
            if (chapter.questions && chapter.questions.length > 0) {
              questionId = chapter.questions[0]._id;
            }
            break;
          }
        }
        if (targetChapter) break;
      }
      if (targetChapter) break;
    }

    if (!targetChapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    if (!questionId) {
      return res.status(404).json({ message: 'No questions found in this chapter' });
    }

    // Check if user is enrolled
    const progress = await UserProgress.findOne({
      userId: req.user._id,
      courseId: course._id
    });

    if (!progress) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Check if answer is correct
    const question = targetChapter.questions[0];
    const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

    // Find or create section progress
    let sectionProgress = progress.sectionsProgress.find(sp =>
      sp.sectionId.equals(sectionId)
    );

    if (!sectionProgress) {
      // Create section progress if it doesn't exist
      sectionProgress = {
        sectionId: sectionId,
        completed: false,
        unitsProgress: []
      };
      progress.sectionsProgress.push(sectionProgress);
    }

    // Find or create unit progress
    let unitProgress = sectionProgress.unitsProgress.find(up =>
      up.unitId.equals(unitId)
    );

    if (!unitProgress) {
      // Create unit progress if it doesn't exist
      unitProgress = {
        unitId: unitId,
        completed: false,
        chaptersProgress: []
      };
      sectionProgress.unitsProgress.push(unitProgress);
    }

    // Find or create chapter progress
    let chapterProgress = unitProgress.chaptersProgress.find(cp =>
      cp.chapterId.equals(chapterId)
    );

    if (!chapterProgress) {
      // Create new chapter progress if it doesn't exist
      chapterProgress = {
        chapterId: chapterId,
        completed: false,
        questionsProgress: [],
        score: 0,
        lastAttempted: new Date()
      };
      unitProgress.chaptersProgress.push(chapterProgress);
    }

    // Update or add question progress
    const existingQuestionIndex = chapterProgress.questionsProgress.findIndex(
      qp => qp.questionId.toString() === questionId.toString()
    );

    const questionProgress = {
      questionId: questionId,
      userAnswer: answer,
      isCorrect: isCorrect,
      attemptedAt: new Date()
    };

    if (existingQuestionIndex > -1) {
      chapterProgress.questionsProgress[existingQuestionIndex] = questionProgress;
    } else {
      chapterProgress.questionsProgress.push(questionProgress);
    }

    // Mark chapter as completed and calculate score
    const totalQuestions = targetChapter.questions.length;
    const answeredQuestions = chapterProgress.questionsProgress.length;
    chapterProgress.completed = totalQuestions === answeredQuestions;

    if (chapterProgress.completed) {
      const correctAnswers = chapterProgress.questionsProgress.filter(qp => qp.isCorrect).length;
      chapterProgress.score = Math.round((correctAnswers / totalQuestions) * 100);
    }

    // Update unit completion
    const totalChaptersInUnit = unitProgress.chaptersProgress.length;
    const completedChaptersInUnit = unitProgress.chaptersProgress.filter(cp => cp.completed).length;
    unitProgress.completed = totalChaptersInUnit > 0 && totalChaptersInUnit === completedChaptersInUnit;

    // Update section completion
    const totalUnitsInSection = sectionProgress.unitsProgress.length;
    const completedUnitsInSection = sectionProgress.unitsProgress.filter(up => up.completed).length;
    sectionProgress.completed = totalUnitsInSection > 0 && totalUnitsInSection === completedUnitsInSection;

    // Calculate overall progress
    let totalChaptersInCourse = 0;
    let completedChaptersInCourse = 0;

    progress.sectionsProgress.forEach(sp => {
      sp.unitsProgress.forEach(up => {
        totalChaptersInCourse += up.chaptersProgress.length;
        completedChaptersInCourse += up.chaptersProgress.filter(cp => cp.completed).length;
      });
    });

    progress.overallProgress = totalChaptersInCourse > 0
      ? Math.round((completedChaptersInCourse / totalChaptersInCourse) * 100)
      : 0;

    progress.completed = progress.overallProgress === 100;
    progress.lastAccessed = new Date();

    await progress.save();

    res.json({
      isCorrect,
      progress: {
        chapterProgress: chapterProgress,
        unitProgress: unitProgress,
        sectionProgress: sectionProgress,
        overallProgress: progress.overallProgress
      }
    });

  } catch (error) {
    console.error('Answer submission error:', error);
    next(error);
  }
});

// Update current chapter route
router.post('/current-chapter/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { chapterId } = req.body;

    // Find user's existing progress for this course
    let progress = await UserProgress.findOne({
      userId: req.user._id,
      courseId
    });

    if (!progress) {
      return res.status(404).json({
        message: 'Progress not found. User is not enrolled in this course.'
      });
    }

    // Update the current chapter
    progress.currentChapter = chapterId;
    progress.lastAccessed = new Date();
    await progress.save();

    res.json({
      message: 'Current chapter updated successfully',
      progress: {
        courseId: progress.courseId,
        overallProgress: progress.overallProgress,
        completed: progress.completed,
        currentChapter: progress.currentChapter
      }
    });
  } catch (error) {
    console.error('Error updating current chapter:', error);
    next(error);
  }
});

// Add this route to clean up any existing progress issues:
router.post('/cleanup/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    const progress = await UserProgress.findOne({
      userId: req.user._id,
      courseId: courseId
    });

    if (!course || !progress) {
      return res.status(404).json({ message: 'Course or progress not found' });
    }

    // Remove duplicate chapter progress entries
    const cleanedSectionsProgress = [];

    course.sections.forEach(section => {
      const existingSectionProgress = progress.sectionsProgress.find(sp =>
        sp.sectionId.equals(section._id)
      );

      if (existingSectionProgress) {
        const cleanedUnitsProgress = [];

        section.units.forEach(unit => {
          const existingUnitProgress = existingSectionProgress.unitsProgress.find(up =>
            up.unitId.equals(unit._id)
          );

          if (existingUnitProgress) {
            const cleanedChaptersProgress = [];

            unit.chapters.forEach(chapter => {
              const existingChapterProgress = existingUnitProgress.chaptersProgress.find(cp =>
                cp.chapterId.equals(chapter._id)
              );

              if (existingChapterProgress) {
                cleanedChaptersProgress.push(existingChapterProgress);
              }
            });

            if (cleanedChaptersProgress.length > 0) {
              cleanedUnitsProgress.push({
                ...existingUnitProgress.toObject(),
                chaptersProgress: cleanedChaptersProgress
              });
            }
          }
        });

        if (cleanedUnitsProgress.length > 0) {
          cleanedSectionsProgress.push({
            ...existingSectionProgress.toObject(),
            unitsProgress: cleanedUnitsProgress
          });
        }
      }
    });

    // Update progress with cleaned data
    progress.sectionsProgress = cleanedSectionsProgress;

    // Recalculate progress
    progress.overallProgress = calculateOverallProgress(course, progress);
    progress.completed = progress.overallProgress === 100;

    await progress.save();

    res.json({
      message: 'Progress cleaned up successfully',
      overallProgress: progress.overallProgress,
      completed: progress.completed
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    next(error);
  }
});

// Update just the fix-enrollment endpoint to properly handle completion status
router.post('/fix-enrollment/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate('sections.units.chapters');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user already has progress for this course
    let progress = await UserProgress.findOne({
      userId: req.user._id,
      courseId
    });

    if (!progress) {
      // Create new progress if not found
      progress = await UserProgress.create({
        userId: req.user._id,
        courseId,
        sectionsProgress: course.sections.map(section => ({
          sectionId: section._id,
          unitsProgress: section.units.map(unit => ({
            unitId: unit._id,
            chaptersProgress: unit.chapters.map(chapter => ({
              chapterId: chapter._id,
              completed: true,  // Mark all as completed
              score: 100        // Set perfect score for each chapter
            }))
          }))
        }))
      });
    } else {
      // Fix progress structure by marking all chapters as completed
      if (progress.sectionsProgress && Array.isArray(progress.sectionsProgress)) {
        progress.sectionsProgress.forEach(section => {
          if (section.unitsProgress && Array.isArray(section.unitsProgress)) {
            section.unitsProgress.forEach(unit => {
              if (unit.chaptersProgress && Array.isArray(unit.chaptersProgress)) {
                unit.chaptersProgress.forEach(chapter => {
                  // Mark all chapters as completed
                  chapter.completed = true;
                  chapter.score = 100;
                });
              }
            });
          }
        });
      }

      // Recalculate overall progress
      const recalculated = calculateOverallProgress(course, progress);
      progress.overallProgress = recalculated;
      progress.completed = recalculated === 100;
      progress.lastAccessed = new Date();
      await progress.save();
    }

    res.json({
      message: 'Enrollment data fixed',
      progress: {
        id: progress._id,
        overallProgress: progress.overallProgress || 100,
        completed: true,
        enrolled: true,
        lastAccessed: progress.lastAccessed,
        currentChapter: null
      }
    });

  } catch (error) {
    console.error('Fix enrollment error:', error);
    next(error);
  }
});

// Debug route to check and fix progress calculation for all courses
router.post('/debug/recalculate-all', async (req, res, next) => {
  try {
    // Get all user progress records
    const allProgress = await UserProgress.find({ userId: req.user._id });
    const results = [];

    for (const progress of allProgress) {
      const course = await Course.findById(progress.courseId);
      if (!course) {
        continue;
      }

      const oldProgress = progress.overallProgress;
      const newProgress = calculateOverallProgress(course, progress);

      progress.overallProgress = newProgress;
      progress.completed = newProgress === 100;
      await progress.save();

      results.push({
        courseTitle: course.title,
        courseId: course._id,
        oldProgress,
        newProgress,
        sectionsCount: course.sections.length,
        totalChapters: course.sections.reduce((acc, section) =>
          acc + section.units.reduce((unitAcc, unit) => unitAcc + unit.chapters.length, 0), 0
        ),
        completedChapters: progress.sectionsProgress?.reduce((acc, sp) =>
          acc + (sp.unitsProgress?.reduce((unitAcc, up) =>
            unitAcc + (up.chaptersProgress?.filter(cp => cp.completed).length || 0), 0) || 0), 0) || 0
      });
    }

    res.json({
      message: 'Progress recalculated for all courses',
      results
    });

  } catch (error) {
    console.error('Debug recalculate error:', error);
    next(error);
  }
});

export default router;
