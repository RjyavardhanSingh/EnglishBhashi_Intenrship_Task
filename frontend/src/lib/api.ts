import axios from 'axios';

const API_URL = 'https://englishbhashi-intenrship-task.onrender.com/api'; // Add /api here

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

export const courseAPI = {
  getCourses: () => api.get('/courses'),
  getCourse: (id: any) => api.get(`/courses/${id}`),
  createCourse: (data: any) => api.post('/courses', data),
  updateCourse: (id: any, data: any) => api.put(`/courses/${id}`, data),
  deleteCourse: (id: any) => api.delete(`/courses/${id}`),
  enrollCourse: (id: any) => api.post(`/courses/${id}/enroll`),
  checkEnrollmentStatus: (courseId: any) => api.get(`/courses/${courseId}/enrollment-status`),
};

export const sectionAPI = {
  getSections: (courseId: any) => api.get(`/courses/${courseId}/sections`),
  getSection: (sectionId: any) => api.get(`/sections/${sectionId}`),
  createSection: (courseId: any, data: any) => api.post(`/courses/${courseId}/sections`, data),
  updateSection: (sectionId: any, data: any) => api.put(`/sections/${sectionId}`, data),
  deleteSection: (sectionId: any) => api.delete(`/sections/${sectionId}`),
};

export const unitAPI = {
  getUnit: (unitId: any) => api.get(`/units/${unitId}`),
  createUnit: (courseId: any, sectionId: any, data: any) => api.post(`/courses/${courseId}/sections/${sectionId}/units`, data),
  updateUnit: (courseId: any, sectionId: any, unitId: any, data: any) => api.put(`/courses/${courseId}/sections/${sectionId}/units/${unitId}`, data),
  deleteUnit: (courseId: any, sectionId: any, unitId: any) => api.delete(`/courses/${courseId}/sections/${sectionId}/units/${unitId}`),
};

export const chapterAPI = {
  getChapter: (chapterId: any) => api.get(`/chapters/${chapterId}`),
  createChapter: (courseId: any, sectionId: any, unitId: any, data: any) => api.post(`/courses/${courseId}/sections/${sectionId}/units/${unitId}/chapters`, data),
  updateChapter: (courseId: any, sectionId: any, unitId: any, chapterId: any, data: any) => api.put(`/courses/${courseId}/sections/${sectionId}/units/${unitId}/chapters/${chapterId}`, data),
  deleteChapter: (courseId: any, sectionId: any, unitId: any, chapterId: any) => api.delete(`/courses/${courseId}/sections/${sectionId}/units/${unitId}/chapters/${chapterId}`),
};

export const progressAPI = {
  getUserProgress: () => api.get('/progress'),
  getCourseProgress: (courseId: string) => api.get(`/progress/${courseId}`),
  updateUserProgress: (courseId: string, data: any) => api.put(`/progress/${courseId}`, data),
  updateCurrentChapter: (courseId: string, chapterId: string) => api.post(`/progress/current-chapter/${courseId}`, { chapterId }),
  markChapterCompleted: (chapterId: string) => api.post('/progress/complete-chapter', { chapterId }),
  submitQuizAnswers: (chapterId: string, answers: any) => api.post('/progress/quiz', { chapterId, answers }),
  submitAnswer: (chapterId: string, answer: any) => api.post('/progress/answer', { chapterId, answer })
};

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  category?: string;
  level?: string;
  isPublished: boolean; // Made isPublished required
  sections?: Section[];
  createdAt: string; // Added createdAt property
}

export interface Section {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  units?: Unit[];
}

export interface Unit {
  _id: string;
  sectionId: string;
  title: string;
  description: string;
  order: number;
  chapters?: Chapter[];
}

export interface Chapter {
  _id: string;
  unitId: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'audio' | 'quiz';
  videoUrl?: string;
  audioUrl?: string;
  questions?: Array<{
    _id: string;
    questionText: string;
    type: 'mcq' | 'fill-in-blank' | 'text';
    options?: string[];
    correctAnswer: string;
  }>;
  order: number;
}

export interface CourseStub {
  _id: string;
  title: string;
  description: string;
}

export interface UserProgress {
  _id: string;
  userId: string;
  courseId: string | CourseStub;
  overallProgress: number;
  completed: boolean;
  completedChapters: string[];
  currentChapter?: string;
  lastAccessed: string;
  sectionsProgress?: Array<{
    sectionId: string;
    unitsProgress?: Array<{
      unitId: string;
      chaptersProgress?: Array<{
        chapterId: string;
        completed: boolean;
        score?: number;
      }>;
    }>;
  }>;
  course?: Course;
}

export default api;
