import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionType: {
    type: String,
    enum: ['MCQ', 'FILL_BLANK', 'TEXT', 'AUDIO'],
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  mediaUrl: {
    type: String
  }
});

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'video', 'audio', 'quiz'],
    default: 'text'
  },
  content: {
    type: String, 
    trim: true
  },
  videoUrl: {
    type: String, 
    trim: true
  },
  audioUrl: {
    type: String, 
    trim: true
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  questions: [{
    type: {
      type: String,
      enum: ['mcq', 'fill-in-blank', 'text'],
      required: true
    },
    questionText: {
      type: String,
      required: true,
      trim: true
    },
    options: [{
      type: String,
      trim: true
    }],
    correctAnswer: {
      type: String,
      required: true,
      trim: true
    }
  }]
}, { timestamps: true });

const unitSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  chapters: [chapterSchema],
  order: {
    type: Number,
    required: true
  }
});

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  units: [unitSchema],
  order: {
    type: Number,
    required: true
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  coverImage: {
    type: String
  },
  sections: [sectionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number
  },
  level: {
    type: String,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    default: 'BEGINNER'
  }
});

courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Course = mongoose.model('Course', courseSchema);

export default Course;
