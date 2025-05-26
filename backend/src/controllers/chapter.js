import Course from '../models/Course.js';
import UserProgress from '../models/UserProgress.js';
import { generateError } from '../utils/index.js';

export const addChapter = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw generateError('Course not found', 404);
    }

    if (course.createdBy.toString() !== req.user._id.toString()) {
      throw generateError('Not authorized', 403);
    }

    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      throw generateError('Section not found', 404);
    }

    const unit = section.units.id(req.params.unitId);
    if (!unit) {
      throw generateError('Unit not found', 404);
    }

    const { 
      title, 
      type, 
      content, 
      videoUrl, 
      audioUrl, 
      order, 
      questions 
    } = req.body;

    const chapterData = {
      title,
      type: type || 'text',
      order: order || unit.chapters.length + 1
    };

    if (type === 'text' && content) {
      chapterData.content = content;
    }
    if (type === 'video' && videoUrl) {
      chapterData.videoUrl = videoUrl;
    }
    if (type === 'audio' && audioUrl) {
      chapterData.audioUrl = audioUrl;
    }
    if (type === 'quiz' && questions) {
      chapterData.questions = questions;
    }

    unit.chapters.push(chapterData);

    await course.save();
    res.status(201).json(unit.chapters[unit.chapters.length - 1]);
  } catch (error) {
    next(error);
  }
};

export const updateChapter = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw generateError('Course not found', 404);
    }

    if (course.createdBy.toString() !== req.user._id.toString()) {
      throw generateError('Not authorized', 403);
    }

    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      throw generateError('Section not found', 404);
    }

    const unit = section.units.id(req.params.unitId);
    if (!unit) {
      throw generateError('Unit not found', 404);
    }

    const chapter = unit.chapters.id(req.params.chapterId);
    if (!chapter) {
      throw generateError('Chapter not found', 404);
    }

    Object.assign(chapter, req.body);
    await course.save();

    res.json(chapter);
  } catch (error) {
    next(error);
  }
};

export const deleteChapter = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw generateError('Course not found', 404);
    }

    if (course.createdBy.toString() !== req.user._id.toString()) {
      throw generateError('Not authorized', 403);
    }

    const section = course.sections.id(req.params.sectionId);
    if (!section) {
      throw generateError('Section not found', 404);
    }

    const unit = section.units.id(req.params.unitId);
    if (!unit) {
      throw generateError('Unit not found', 404);
    }

    unit.chapters.pull(req.params.chapterId);
    await course.save();

    res.status(200).json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const submitChapterAnswer = async (req, res, next) => {
  try {
    const { answer } = req.body;
    const { courseId, sectionId, unitId, chapterId, questionId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      throw generateError('Course not found', 404);
    }

    const section = course.sections.id(sectionId);
    if (!section) {
      throw generateError('Section not found', 404);
    }

    const unit = section.units.id(unitId);
    if (!unit) {
      throw generateError('Unit not found', 404);
    }

    const chapter = unit.chapters.id(chapterId);
    if (!chapter) {
      throw generateError('Chapter not found', 404);
    }

    const question = chapter.questions.id(questionId);
    if (!question) {
      throw generateError('Question not found', 404);
    }

    const isCorrect = answer.toLowerCase() === question.correctAnswer.toLowerCase();

    const progress = await UserProgress.findOne({
      userId: req.user._id,
      courseId
    });

    if (!progress) {
      throw generateError('Not enrolled in this course. Please enroll first.', 403);
    }

    const sectionProgress = progress.sectionsProgress.find(
      sp => sp.sectionId.equals(sectionId)
    );
    if (!sectionProgress) {
      throw generateError('Section progress not found', 404);
    }

    const unitProgress = sectionProgress.unitsProgress.find(
      up => up.unitId.equals(unitId)
    );
    if (!unitProgress) {
      throw generateError('Unit progress not found', 404);
    }

    const chapterProgress = unitProgress.chaptersProgress.find(
      cp => cp.chapterId.equals(chapterId)
    );
    if (!chapterProgress) {
      throw generateError('Chapter progress not found', 404);
    }

    const questionProgress = {
      questionId,
      userAnswer: answer,
      isCorrect,
      attemptedAt: new Date()
    };

    const existingQuestionIndex = chapterProgress.questionsProgress.findIndex(
      qp => qp.questionId.toString() === questionId
    );

    if (existingQuestionIndex > -1) {
      chapterProgress.questionsProgress[existingQuestionIndex] = questionProgress;
    } else {
      chapterProgress.questionsProgress.push(questionProgress);
    }

    const chapterTotalQuestions = chapter.questions.length;
    const chapterAnsweredQuestions = chapterProgress.questionsProgress.length;
    chapterProgress.completed = chapterTotalQuestions === chapterAnsweredQuestions;

    if (chapterProgress.completed) {
      const correctAnswers = chapterProgress.questionsProgress.filter(qp => qp.isCorrect).length;
      chapterProgress.score = (correctAnswers / chapterTotalQuestions) * 100;
    }

    unitProgress.completed = unitProgress.chaptersProgress.every(cp => cp.completed);
    
    sectionProgress.completed = sectionProgress.unitsProgress.every(up => up.completed);
    
    const courseTotalSections = course.sections.length;
    const courseCompletedSections = progress.sectionsProgress.filter(sp => sp.completed).length;
    progress.completed = courseTotalSections === courseCompletedSections;
    progress.overallProgress = (courseCompletedSections / courseTotalSections) * 100;

    await progress.save();

    res.json({
      isCorrect,
      progress: {
        chapterProgress,
        unitProgress,
        sectionProgress,
        overallProgress: progress.overallProgress
      }
    });
  } catch (error) {
    next(error);
  }
};
