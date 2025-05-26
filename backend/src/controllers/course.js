import Course from '../models/Course.js';
import UserProgress from '../models/UserProgress.js';
import { generateError } from '../utils/index.js';

export const createCourse = async (req, res, next) => {
  try {
    const { title, description, coverImage, level, duration } = req.body;

    const course = await Course.create({
      title,
      description,
      coverImage,
      level,
      duration,
      createdBy: req.user._id,
      sections: []
    });

    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};

export const getCourses = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { isPublished: true };
    const courses = await Course.find(query)
      .populate('createdBy', 'username email')
      .sort('-createdAt');

    res.json(courses);
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate('createdBy', 'username email');

    if (!course) {
      throw generateError('Course not found', 404);
    }

    if (!course.isPublished && req.user.role !== 'admin') {
      throw generateError('Course not available', 403);
    }

    res.json(course);
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw generateError('Course not found', 404);
    }

    if (course.createdBy.toString() !== req.user._id.toString()) {
      throw generateError('Not authorized', 403);
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.courseId,
      req.body,
      { new: true }
    );

    res.json(updatedCourse);
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw generateError('Course not found', 404);
    }

    if (course.createdBy.toString() !== req.user._id.toString()) {
      throw generateError('Not authorized', 403);
    }

    await Course.deleteOne({ _id: req.params.courseId });
    await UserProgress.deleteMany({ courseId: req.params.courseId });

    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const publishCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw generateError('Course not found', 404);
    }

    if (course.createdBy.toString() !== req.user._id.toString()) {
      throw generateError('Not authorized', 403);
    }

    course.isPublished = !course.isPublished;
    await course.save();

    res.json(course);
  } catch (error) {
    next(error);
  }
};

export const enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw generateError('Course not found', 404);
    }

    if (!course.isPublished) {
      throw generateError('Course is not available for enrollment', 403);
    }

    const alreadyEnrolled = await UserProgress.findOne({
      userId: req.user._id,
      courseId: course._id
    });

    if (alreadyEnrolled) {
      throw generateError('Already enrolled in this course', 400);
    }

    const userProgress = await UserProgress.create({
      userId: req.user._id,
      courseId: course._id,
      sectionsProgress: course.sections.map(section => ({
        sectionId: section._id,
        unitsProgress: section.units.map(unit => ({
          unitId: unit._id,
          chaptersProgress: unit.chapters.map(chapter => ({
            chapterId: chapter._id
          }))
        }))
      }))
    });

    await req.user.updateOne({ $push: { enrolledCourses: course._id } });

    res.status(201).json(userProgress);
  } catch (error) {
    next(error);
  }
};
