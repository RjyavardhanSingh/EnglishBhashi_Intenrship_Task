'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { courseAPI, sectionAPI, unitAPI, chapterAPI, Course, Section, Unit, Chapter } from '@/lib/api';

export default function CourseEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit states
  const [editingCourse, setEditingCourse] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    isPublished: false
  });
  const [sectionForm, setSectionForm] = useState({ title: '', description: '' });
  const [unitForm, setUnitForm] = useState({ title: '', description: '' });
  const [chapterForm, setChapterForm] = useState({
    title: '',
    content: '',
    type: 'text' as 'text' | 'video' | 'audio' | 'quiz',
    videoUrl: '',
    audioUrl: '',
    questions: [{
      questionText: '',
      questionType: 'mcq' as 'mcq' | 'fill-in-blank' | 'text',
      options: ['', '', '', ''],
      correctAnswer: ''
    }]
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadCourseData();
  }, [user, courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const [courseResponse, sectionsResponse] = await Promise.all([
        courseAPI.getCourse(courseId),
        sectionAPI.getSections(courseId)
      ]);
      
      setCourse(courseResponse.data);
      setSections(sectionsResponse.data);
      
      setCourseForm({
        title: courseResponse.data.title,
        description: courseResponse.data.description,
        category: courseResponse.data.category || '',
        isPublished: courseResponse.data.isPublished
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async () => {
    try {
      await courseAPI.updateCourse(courseId, courseForm);
      setEditingCourse(false);
      loadCourseData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update course');
    }
  };

  const handleCreateSection = async () => {
    try {
      await sectionAPI.createSection(courseId, sectionForm);
      setSectionForm({ title: '', description: '' });
      loadCourseData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create section');
    }
  };

  const handleCreateUnit = async (sectionId: string) => {
    try {
      await unitAPI.createUnit(courseId, sectionId, unitForm);
      setUnitForm({ title: '', description: '' });
      loadCourseData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create unit');
    }
  };

  const handleCreateChapter = async (unitId: string) => {
    try {
      // Validate required fields
      if (!chapterForm.title.trim()) {
        setError('Chapter title is required');
        return;
      }

      // Additional validation based on chapter type
      if (chapterForm.type === 'text' && !chapterForm.content?.trim()) {
        setError('Chapter content is required for text chapters');
        return;
      }

      if (chapterForm.type === 'video' && !chapterForm.videoUrl?.trim()) {
        setError('Video URL is required for video chapters');
        return;
      }

      if (chapterForm.type === 'audio' && !chapterForm.audioUrl?.trim()) {
        setError('Audio URL is required for audio chapters');
        return;
      }

      if (chapterForm.type === 'quiz') {
        const validQuestions = chapterForm.questions.filter(q => q.questionText.trim());
        if (validQuestions.length === 0) {
          setError('At least one question is required for quiz chapters');
          return;
        }

        // Validate each question has a correct answer
        for (const question of validQuestions) {
          if (!question.correctAnswer.trim()) {
            setError('All questions must have a correct answer');
            return;
          }

          // For MCQ, validate that there are options and correct answer matches one of them
          if (question.questionType === 'mcq') {
            const validOptions = question.options.filter(opt => opt.trim());
            if (validOptions.length < 2) {
              setError('Multiple choice questions must have at least 2 options');
              return;
            }
            if (!validOptions.includes(question.correctAnswer)) {
              setError('Correct answer must match one of the provided options');
              return;
            }
          }
        }
      }

      // Find which section and unit this belongs to
      let sectionId = '';
      let unitOrder = 1;
      
      for (const section of sections) {
        const unit = section.units?.find(u => u._id === unitId);
        if (unit) {
          sectionId = section._id;
          unitOrder = (unit.chapters?.length || 0) + 1;
          break;
        }
      }

      if (!sectionId) {
        setError('Could not find section for this unit');
        return;
      }

      // Prepare chapter data based on type
      const chapterData: any = {
        title: chapterForm.title.trim(),
        type: chapterForm.type,
        order: unitOrder
      };

      // Add type-specific data
      if (chapterForm.type === 'text') {
        chapterData.content = chapterForm.content?.trim();
      } else if (chapterForm.type === 'video') {
        chapterData.videoUrl = chapterForm.videoUrl?.trim();
      } else if (chapterForm.type === 'audio') {
        chapterData.audioUrl = chapterForm.audioUrl?.trim();
      } else if (chapterForm.type === 'quiz') {
        const questions = chapterForm.questions
          .filter(q => q.questionText.trim())
          .map(question => {
            const questionData: any = {
              type: question.questionType,
              questionText: question.questionText.trim(),
              correctAnswer: question.correctAnswer.trim()
            };

            // Add options for MCQ
            if (question.questionType === 'mcq') {
              questionData.options = question.options
                .filter(option => option.trim() !== '')
                .map(option => option.trim());
            }

            return questionData;
          });
        
        chapterData.questions = questions;
      }

      console.log('Creating chapter with data:', chapterData); // Debug log

      await chapterAPI.createChapter(courseId, sectionId, unitId, chapterData);
      
      // Reset form
      setChapterForm({
        title: '',
        content: '',
        type: 'text',
        videoUrl: '',
        audioUrl: '',
        questions: [{
          questionText: '',
          questionType: 'mcq',
          options: ['', '', '', ''],
          correctAnswer: ''
        }]
      });
      
      // Clear any previous errors
      setError('');
      
      loadCourseData();
    } catch (err: any) {
      console.error('Chapter creation error:', err);
      setError(err.response?.data?.message || 'Failed to create chapter');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      try {
        await sectionAPI.deleteSection(sectionId);
        loadCourseData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete section');
      }
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (confirm('Are you sure you want to delete this unit?')) {
      try {
        // Find which section contains this unit
        let sectionId = '';
        for (const section of sections) {
          if (section.units?.some(unit => unit._id === unitId)) {
            sectionId = section._id;
            break;
          }
        }
        
        if (!sectionId) {
          setError('Could not find section for this unit');
          return;
        }

        await unitAPI.deleteUnit(courseId, sectionId, unitId);
        loadCourseData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete unit');
      }
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (confirm('Are you sure you want to delete this chapter?')) {
      try {
        // Find which section and unit contains this chapter
        let sectionId = '';
        let unitId = '';
        
        for (const section of sections) {
          for (const unit of section.units || []) {
            if (unit.chapters?.some(chapter => chapter._id === chapterId)) {
              sectionId = section._id;
              unitId = unit._id;
              break;
            }
          }
          if (sectionId) break;
        }
        
        if (!sectionId || !unitId) {
          setError('Could not find section/unit for this chapter');
          return;
        }

        await chapterAPI.deleteChapter(courseId, sectionId, unitId, chapterId);
        loadCourseData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete chapter');
      }
    }
  };

  const addNewQuestion = () => {
    setChapterForm(prev => ({
      ...prev,
      questions: [...prev.questions, {
        questionText: '',
        questionType: 'mcq' as 'mcq' | 'fill-in-blank' | 'text',
        options: ['', '', '', ''],
        correctAnswer: ''
      }]
    }));
  };

  const removeQuestion = (index: number) => {
    setChapterForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setChapterForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setChapterForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: q.options.map((opt, oi) => oi === optionIndex ? value : opt) }
          : q
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  {editingCourse ? 'Edit Course' : course?.title}
                </h1>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  course?.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {course?.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <button
                onClick={() => setEditingCourse(!editingCourse)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                {editingCourse ? 'Cancel' : 'Edit Course'}
              </button>
            </div>
          </div>

          {/* Course Edit Form */}
          {editingCourse && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select category</option>
                    <option value="English">English</option>
                    <option value="Grammar">Grammar</option>
                    <option value="Vocabulary">Vocabulary</option>
                    <option value="Speaking">Speaking</option>
                    <option value="Listening">Listening</option>
                    <option value="Reading">Reading</option>
                    <option value="Writing">Writing</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={courseForm.isPublished}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Published</label>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingCourse(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCourse}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section._id} className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingSection(editingSection === section._id ? null : section._id)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 mt-1">{section.description}</p>
              </div>

              {/* Units */}
              <div className="p-6">
                {section.units?.map((unit) => (
                  <div key={unit._id} className="ml-4 mb-4 border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-800">{unit.title}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingUnit(editingUnit === unit._id ? null : unit._id)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(unit._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{unit.description}</p>

                    {/* Chapters */}
                    <div className="mt-2 ml-4">
                      {unit.chapters?.map((chapter) => (
                        <div key={chapter._id} className="mb-2 p-2 bg-gray-50 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{chapter.title}</span>
                            <div className="flex space-x-2">
                              <span className="text-xs text-gray-500">{chapter.type}</span>
                              <button
                                onClick={() => setEditingChapter(editingChapter === chapter._id ? null : chapter._id)}
                                className="text-indigo-600 hover:text-indigo-800 text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteChapter(chapter._id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add Chapter Form */}
                      <div className="mt-2">
                        <div className="space-y-3 p-3 bg-gray-50 rounded">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Chapter title *"
                              value={chapterForm.title}
                              onChange={(e) => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
                              className={`flex-1 px-3 py-2 border rounded text-gray-900 bg-white ${
                                !chapterForm.title.trim() ? 'border-red-300' : 'border-gray-300'
                              }`}
                              required
                            />
                            <select
                              value={chapterForm.type}
                              onChange={(e) => setChapterForm(prev => ({ ...prev, type: e.target.value as 'text' | 'video' | 'audio' | 'quiz' }))}
                              className="px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                            >
                              <option value="text">Text</option>
                              <option value="video">Video</option>
                              <option value="audio">Audio</option>
                              <option value="quiz">Quiz</option>
                            </select>
                          </div>

                          {/* Content field for text chapters */}
                          {chapterForm.type === 'text' && (
                            <textarea
                              placeholder="Chapter content *"
                              value={chapterForm.content || ''}
                              onChange={(e) => setChapterForm(prev => ({ ...prev, content: e.target.value }))}
                              className={`w-full px-3 py-2 border rounded text-gray-900 bg-white resize-vertical ${
                                !chapterForm.content?.trim() ? 'border-red-300' : 'border-gray-300'
                              }`}
                              rows={4}
                              required
                            />
                          )}

                          {/* Video URL field */}
                          {chapterForm.type === 'video' && (
                            <div>
                              <input
                                type="url"
                                placeholder="Video URL (YouTube, Vimeo, etc.) *"
                                value={chapterForm.videoUrl || ''}
                                onChange={(e) => setChapterForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                                className={`w-full px-3 py-2 border rounded text-gray-900 bg-white ${
                                  !chapterForm.videoUrl?.trim() ? 'border-red-300' : 'border-gray-300'
                                }`}
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Use YouTube watch URLs (https://www.youtube.com/watch?v=...) or Vimeo URLs (https://vimeo.com/...)
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                              </p>
                            </div>
                          )}

                          {/* Audio URL field */}
                          {chapterForm.type === 'audio' && (
                            <input
                              type="url"
                              placeholder="Audio URL *"
                              value={chapterForm.audioUrl || ''}
                              onChange={(e) => setChapterForm(prev => ({ ...prev, audioUrl: e.target.value }))}
                              className={`w-full px-3 py-2 border rounded text-gray-900 bg-white ${
                                !chapterForm.audioUrl?.trim() ? 'border-red-300' : 'border-gray-300'
                              }`}
                              required
                            />
                          )}

                          {/* Quiz questions field */}
                          {chapterForm.type === 'quiz' && (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium text-gray-900">Questions *</h5>
                                <button
                                  type="button"
                                  onClick={addNewQuestion}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  Add Question
                                </button>
                              </div>
                              
                              {chapterForm.questions.map((question, questionIndex) => (
                                <div key={questionIndex} className="p-4 border border-gray-200 rounded bg-white">
                                  <div className="flex justify-between items-center mb-3">
                                    <h6 className="font-medium text-gray-800">Question {questionIndex + 1}</h6>
                                    {chapterForm.questions.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeQuestion(questionIndex)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                  
                                  <input
                                    type="text"
                                    placeholder="Question text *"
                                    value={question.questionText}
                                    onChange={(e) => updateQuestion(questionIndex, 'questionText', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded text-gray-900 bg-white mb-2 ${
                                      !question.questionText.trim() ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    required
                                  />
                                  
                                  <select
                                    value={question.questionType}
                                    onChange={(e) => updateQuestion(questionIndex, 'questionType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white mb-2"
                                  >
                                    <option value="mcq">Multiple Choice</option>
                                    <option value="fill-in-blank">Fill in the Blank</option>
                                    <option value="text">Text Answer</option>
                                  </select>
                                  
                                  {question.questionType === 'mcq' && (
                                    <div className="space-y-1 mb-2">
                                      {question.options.map((option, optionIndex) => (
                                        <input
                                          key={optionIndex}
                                          type="text"
                                          placeholder={`Option ${optionIndex + 1} ${optionIndex < 2 ? '*' : ''}`}
                                          value={option}
                                          onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                                          className={`w-full px-3 py-2 border rounded text-gray-900 bg-white ${
                                            optionIndex < 2 && !option.trim() ? 'border-red-300' : 'border-gray-300'
                                          }`}
                                          required={optionIndex < 2}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  
                                  <input
                                    type="text"
                                    placeholder="Correct answer *"
                                    value={question.correctAnswer}
                                    onChange={(e) => updateQuestion(questionIndex, 'correctAnswer', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded text-gray-900 bg-white ${
                                      !question.correctAnswer.trim() ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    required
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => handleCreateChapter(unit._id)}
                            disabled={!chapterForm.title.trim()}
                            className={`w-full px-3 py-2 rounded transition-colors ${
                              !chapterForm.title.trim()
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            Add Chapter
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Unit Form */}
                <div className="ml-4 mt-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Unit title"
                      value={unitForm.title}
                      onChange={(e) => setUnitForm(prev => ({ ...prev, title: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="Unit description"
                      value={unitForm.description}
                      onChange={(e) => setUnitForm(prev => ({ ...prev, description: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900"
                    />
                    <button
                      onClick={() => handleCreateUnit(section._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Unit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Section Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Section</h3>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Section title"
                value={sectionForm.title}
                onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Section description"
                value={sectionForm.description}
                onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={handleCreateSection}
                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
