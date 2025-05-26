import Course from '../models/Course.js';
import { generateError } from '../utils/index.js';

export const addSection = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw generateError('Course not found', 404);
    }

    if (course.createdBy.toString() !== req.user._id.toString()) {
      throw generateError('Not authorized', 403);
    }

    const { title, description, order } = req.body;

    course.sections.push({
      title,
      description,
      order: order || course.sections.length + 1,
      units: []
    });

    await course.save();
    res.status(201).json(course.sections[course.sections.length - 1]);
  } catch (error) {
    next(error);
  }
};

export const updateSection = async (req, res, next) => {
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

    Object.assign(section, req.body);
    await course.save();

    res.json(section);
  } catch (error) {
    next(error);
  }
};

export const deleteSection = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      throw generateError('Course not found', 404);
    }

    if (course.createdBy.toString() !== req.user._id.toString()) {
      throw generateError('Not authorized', 403);
    }

    course.sections.pull(req.params.sectionId);
    await course.save();

    res.status(200).json({ message: 'Section deleted successfully' });
  } catch (error) {
    next(error);
  }
};
