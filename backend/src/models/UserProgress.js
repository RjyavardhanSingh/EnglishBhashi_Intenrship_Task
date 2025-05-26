import mongoose from 'mongoose';

const questionProgressSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userAnswer: String,
  isCorrect: Boolean,
  attemptedAt: {
    type: Date,
    default: Date.now
  }
});

const chapterProgressSchema = new mongoose.Schema({
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  questionsProgress: [questionProgressSchema],
  score: {
    type: Number,
    default: 0
  },
  lastAttempted: {
    type: Date,
    default: Date.now
  }
});

const unitProgressSchema = new mongoose.Schema({
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  chaptersProgress: [chapterProgressSchema],
  lastAttempted: {
    type: Date,
    default: Date.now
  }
});

const sectionProgressSchema = new mongoose.Schema({
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  unitsProgress: [unitProgressSchema],
  lastAttempted: {
    type: Date,
    default: Date.now
  }
});

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  sectionsProgress: [sectionProgressSchema],
  overallProgress: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  currentChapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    default: null
  }
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

export default UserProgress;
