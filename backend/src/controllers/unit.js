import Course from '../models/Course.js';
import { generateError } from '../utils/index.js';

export const addUnit = async (req, res, next) => {
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

    const { title, description, order } = req.body;

    section.units.push({
      title,
      description,
      order: order || section.units.length + 1,
      chapters: []
    });

    await course.save();
    res.status(201).json(section.units[section.units.length - 1]);
  } catch (error) {
    next(error);
  }
};

export const updateUnit = async (req, res, next) => {
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

    Object.assign(unit, req.body);
    await course.save();

    res.json(unit);
  } catch (error) {
    next(error);
  }
};

export const deleteUnit = async (req, res, next) => {
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

    section.units.pull(req.params.unitId);
    await course.save();

    res.status(200).json({ message: 'Unit deleted successfully' });
  } catch (error) {
    next(error);
  }
};
