'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { courseAPI, sectionAPI, progressAPI, Course, Section, UserProgress, Chapter } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

const CourseCompletionModal = ({ isOpen, onClose, courseName }: { 
  isOpen: boolean; 
  onClose: () => void; 
  courseName: string; 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Congratulations!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You have successfully completed the course "{courseName}"!
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Continue Learning
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizResultsModal = ({ 
  isOpen, 
  onClose, 
  result, 
  chapter 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  result: any; 
  chapter: any; 
}) => {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 max-h-96 overflow-y-auto">
        <div className="text-center">
          {/* Score Display */}
          <div className="text-6xl font-bold mb-4">
            <span className={`${(result.score >= 60) ? 'text-green-600' : 'text-red-600'}`}>
              {result.score || 0}%
            </span>
          </div>
          
          {/* Pass/Fail Status */}
          <div className={`inline-block px-4 py-2 rounded-full text-lg font-medium mb-4 ${
            (result.score >= 60) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {(result.score >= 60) ? '🎉 PASSED!' : '❌ FAILED'}
          </div>
          
          {/* Score Details */}
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              You answered <span className="font-semibold">{result.correctAnswers || 0}</span> out of{' '}
              <span className="font-semibold">{result.totalQuestions || chapter.questions.length}</span> questions correctly
            </p>
            <p className="text-sm text-gray-500">
              (60% required to pass)
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                (result.score || 0) >= 60 ? 'bg-green-600' : 'bg-red-600'
              }`}
              style={{ width: `${result.score || 0}%` }}
            ></div>
          </div>

          {/* Course Progress Update */}
          {result.progress?.overallProgress && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded">
              <p className="text-sm text-indigo-700 font-medium mb-1">
                Course Progress Updated: {Math.round(result.progress.overallProgress)}%
              </p>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${result.progress.overallProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Course Completion Celebration */}
          {result.progress?.overallProgress === 100 && (
            <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded">
              <p className="text-green-700 font-bold text-lg">🎉 Course Completed!</p>
              <p className="text-green-600 text-sm">Congratulations on finishing the entire course!</p>
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Continue Learning
          </button>
        </div>
      </div>
    </div>
  );
};



export default function CourseViewPage() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const { darkMode } = useTheme();

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canMarkCompleted, setCanMarkCompleted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [previousProgress, setPreviousProgress] = useState(0);
  const [showQuizResultsModal, setShowQuizResultsModal] = useState(false);
  const [quizModalResult, setQuizModalResult] = useState<any>(null);

  // Add refs to prevent multiple simultaneous loads
  const loadingRef = useRef(false);
  const loadedRef = useRef(false);

  // SINGLE loadCourseData function with loading prevention
  const loadCourseData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log('Load already in progress, skipping');
      return;
    }
    
    // Prevent loading if already loaded (unless forced refresh)
    if (loadedRef.current && course && progress) {
      console.log('Course already loaded and enrolled, skipping');
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      
      console.log('Loading course data for:', courseId);
      
      // Get course data
      const courseResponse = await courseAPI.getCourse(courseId);
      console.log('Course data loaded:', courseResponse.data);
      
      setCourse(courseResponse.data);
      setSections(courseResponse.data.sections || []);

      // Get user progress with better error handling
      try {
        // First try to get specific course progress (this has calculated values)
        let courseProgress = null;
        let enrolled = false;
        
        try {
          console.log('Getting specific course progress for:', courseId);
          const specificProgressResponse = await progressAPI.getCourseProgress(courseId);
          console.log('Specific course progress response:', specificProgressResponse.data);
          
          if (specificProgressResponse.data) {
            courseProgress = specificProgressResponse.data;
            enrolled = true;
            console.log('Found specific course progress with calculated values');
          }
        } catch (specificErr) {
          console.log('Specific course progress not found, trying general progress...');
          
          // Fallback: try general progress API
          const progressResponse = await progressAPI.getUserProgress();
          console.log('General progress response:', progressResponse.data);
          
          if (Array.isArray(progressResponse.data)) {
            courseProgress = progressResponse.data.find(p => {
              // Multiple ways to match the course
              return (
                p.courseId === courseId || 
                p.course?._id === courseId ||
                p.course?.id === courseId ||
                (typeof p.course === 'string' && p.course === courseId) ||
                (p.course && typeof p.course === 'object' && (
                  p.course._id === courseId || 
                  p.course.id === courseId
                ))
              );
            });
            
            enrolled = !!courseProgress;
            console.log('General progress search result:', { found: enrolled });
          }
        }
        
        // Additional check: try enrollment status API if still not found
        if (!enrolled) {
          try {
            console.log('Checking enrollment status via API...');
            const enrollmentCheck = await courseAPI.checkEnrollmentStatus(courseId);
            console.log('Enrollment status response:', enrollmentCheck.data);
            
            if (enrollmentCheck.data?.enrolled) {
              enrolled = true;
              // If enrolled but no progress found, create minimal progress object
              if (!courseProgress) {
                courseProgress = {
                  courseId: courseId,
                  overallProgress: 0,
                  completed: false,
                  sectionsProgress: []
                };
              }
            }
          } catch (enrollmentErr) {
            console.warn('Enrollment status check failed:', enrollmentErr);
          }
        }
        
        console.log('Final enrollment decision:', { enrolled, courseProgress });
        
        if (enrolled && courseProgress) {
          console.log('User is enrolled, setting progress...');
          
          // IMPORTANT: Don't normalize - use the exact progress from backend
          console.log('Raw courseProgress from API:', courseProgress);
          
          // Use the progress exactly as returned from backend
          setProgress(courseProgress);
          
          // Debug log to see what we're setting
          console.log('Setting progress state to:', {
            overallProgress: courseProgress.overallProgress,
            completed: courseProgress.completed,
            sectionsProgress: courseProgress.sectionsProgress?.length
          });
          
          // Set current chapter if available
          if (!currentChapter && courseProgress.currentChapter) {
            console.log('Setting current chapter from progress...');
            for (const section of courseResponse.data.sections || []) {
              for (const unit of section.units || []) {
                for (const chapter of unit.chapters || []) {
                  if (chapter._id === courseProgress.currentChapter) {
                    console.log('Found and setting current chapter:', chapter.title);
                    setCurrentChapter(chapter);
                    break;
                  }
                }
              }
            }
          }
        } else {
          console.log('User not enrolled - showing enrollment page');
          setProgress(null);
        }
        
      } catch (progressErr) {
        console.error('Progress loading error:', progressErr);
        
        // If progress loading fails, try to check enrollment status
        try {
          console.log('Fallback: checking enrollment status...');
          const enrollmentCheck = await courseAPI.checkEnrollmentStatus(courseId);
          
          if (enrollmentCheck.data?.enrolled) {
            console.log('User is enrolled (fallback check), creating minimal progress...');
            // Ensure all required fields for UserProgress are present
            setProgress({
              _id: `temp-progress-${courseId}-${user?._id || 'unknown'}`, // Placeholder _id
              userId: user?._id || 'unknown-user', // Get userId from auth context
              courseId: courseId,
              overallProgress: 0,
              completed: false,
              sectionsProgress: [],
              completedChapters: [], // Add missing completedChapters
              lastAccessed: new Date().toISOString(), // Add missing lastAccessed
              // Add other fields from UserProgress with default values if necessary
              // e.g., currentChapter: null, currentUnit: null, currentSection: null
            });
          } else {
            console.log('User not enrolled (fallback check)');
            setProgress(null);
          }
        } catch (fallbackErr) {
          console.error('Fallback enrollment check failed:', fallbackErr);
          setProgress(null);
        }
      }
      
      loadedRef.current = true;
      
    } catch (err: any) {
      console.error('Failed to load course data:', err);
      setError(err.response?.data?.message || 'Failed to load course data');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [courseId]); // Only depend on courseId

  // Force refresh function for when we need to reload after changes
  const forceRefreshProgress = useCallback(async () => {
    console.log('Force refreshing progress...');
    loadedRef.current = false; // Reset loaded flag
    await loadCourseData();
  }, [loadCourseData]);

  // SINGLE useEffect for authentication and initial load
  useEffect(() => {
    // Reset loading states when courseId changes
    loadingRef.current = false;
    loadedRef.current = false;
    
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Only load if user is authenticated
      loadCourseData();
    }
  }, [user, authLoading, courseId, loadCourseData]); // Stable dependencies

  // Update handleMarkCompleted to use forceRefreshProgress
  const handleMarkCompleted = useCallback(async () => {
    if (!currentChapter) return;
    
    if (isCurrentChapterCompleted()) {
      console.log('Chapter already completed, ignoring click');
      return;
    }
    
    try {
      setLoading(true);
      setCanMarkCompleted(false);
      
      console.log('Marking chapter as completed:', currentChapter._id);
      await progressAPI.markChapterCompleted(currentChapter._id);
      
      // Use force refresh instead of loadCourseData
      await forceRefreshProgress();
      
      console.log('Chapter marked as completed successfully');
      
      // Auto-navigate to next chapter
      setTimeout(() => {
        navigateToNextChapter();
      }, 1500);
      
      setError('');
    } catch (err: any) {
      console.error('Failed to mark chapter as completed:', err);
      setError(err.response?.data?.message || 'Failed to mark chapter as completed.');
      if (!isCurrentChapterCompleted()) {
        setCanMarkCompleted(true);
      }
    } finally {
      setLoading(false);
    }
  }, [currentChapter, forceRefreshProgress]); // Stable dependencies

  // Update handleChapterSelect to be more stable
  const handleChapterSelect = useCallback(async (chapter: Chapter) => {
    if (!progress) return;
    
    try {
      setCurrentChapter(chapter);
      
      const isCompleted = progress.sectionsProgress?.some(sp => 
        sp.unitsProgress?.some(up => 
          up.chaptersProgress?.some(cp => 
            cp.chapterId === chapter._id && cp.completed === true
          )
        )
      );
      
      setCanMarkCompleted(false);
      
      if (!isCompleted) {
        if (chapter.type === 'text') {
          const contentLength = chapter.content?.length || 0;
          const wordCount = chapter.content?.split(' ').length || 0;
          
          if (contentLength < 200 || wordCount < 20) {
            setCanMarkCompleted(true);
          } else if (contentLength < 500 || wordCount < 50) {
            setTimeout(() => {
              if (!isCurrentChapterCompleted()) {
                setCanMarkCompleted(true);
              }
            }, 2000);
          }
        } else if (chapter.type === 'audio') {
          setCanMarkCompleted(false);
        } else if (chapter.type === 'video') {
          setCanMarkCompleted(false);
        } else {
          setCanMarkCompleted(true);
        }
      }
      
      // Update current chapter in backend (without triggering reload)
      if (chapter._id !== progress.currentChapter) {
        try {
          await progressAPI.updateCurrentChapter(courseId, chapter._id);
        } catch (err: any) {
          console.error('Failed to update current chapter:', err);
        }
      }
    } catch (err: any) {
      console.error('Failed to update progress:', err);
      setError(err.response?.data?.message || 'Failed to update progress');
    }
  }, [progress, courseId]); // Stable dependencies

  // Other functions remain the same but use useCallback for stability
  const isCurrentChapterCompleted = useCallback(() => {
    if (!progress || !currentChapter) return false;
    
    return progress.sectionsProgress?.some(sp => 
      sp.unitsProgress?.some(up => 
        up.chaptersProgress?.some(cp => 
          cp.chapterId === currentChapter._id && cp.completed === true
        )
      )
    );
  }, [progress, currentChapter]);

  const navigateToNextChapter = useCallback(() => {
    if (!currentChapter || !sections) return;
    
    let nextChapter: Chapter | null = null;
    let found = false;
    
    for (const section of sections) {
      for (const unit of section.units || []) {
        for (const chapter of unit.chapters || []) {
          if (found) {
            nextChapter = chapter;
            break;
          }
          if (chapter._id === currentChapter._id) {
            found = true;
          }
        }
        if (nextChapter) break;
      }
      if (nextChapter) break;
    }
    
    if (nextChapter) {
      handleChapterSelect(nextChapter);
    } else if (progress?.overallProgress === 100) {
      setShowCompletionModal(true);
    }
  }, [currentChapter, sections, progress, handleChapterSelect]);

  const handleEnroll = async () => {
    try {
      await courseAPI.enrollCourse(courseId);
      loadCourseData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
    }
  };

  

  // Update the component to check if current chapter is already completed


 

 

  const handleTextScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Don't enable if already completed
    if (isCurrentChapterCompleted()) {
      return;
    }
    
    const target = e.target as HTMLDivElement;
    const scrollPosition = target.scrollTop + target.clientHeight;
    const scrollHeight = target.scrollHeight;
    
    console.log('Text scroll:', { scrollPosition, scrollHeight, percentage: (scrollPosition / scrollHeight) * 100 });
    
    // Consider 90% scrolled as "read to the end" (more lenient)
    if (scrollPosition >= scrollHeight * 0.9) {
      console.log('Text chapter - enabling completion button after scrolling');
      setCanMarkCompleted(true);
    }
  };

  const handleVideoEnd = () => {
    setCanMarkCompleted(true);
  };

  const handleAudioEnd = () => {
    setCanMarkCompleted(true);
  };

  const handleAnswerSubmit = async (chapterId: string, answer: any) => {
    try {
      await progressAPI.submitAnswer(chapterId, answer);
      loadCourseData(); // Refresh progress
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit answer');
    }
  };

  const QuestionInterface = ({ chapter }: { chapter: any }) => {
    const [answers, setAnswers] = useState<{[key: string]: string}>({});
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleAnswerChange = (questionId: string, answer: string) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
    };

    const handleSubmitQuiz = async () => {
      try {
        console.log('Submitting quiz for chapter:', chapter._id);
        console.log('Answers:', answers);
        
        const response = await progressAPI.submitQuizAnswers(chapter._id, answers);
        console.log('Submit response:', response);
        console.log('Response data:', response.data);
        console.log('Score from response:', response.data.score);
        console.log('Results from response:', response.data.results);
        
        setResult(response.data);
        setSubmitted(true);
        
        // Show the quiz results modal popup
        setQuizModalResult(response.data);
        setShowQuizResultsModal(true);
        
        // Refresh course data to update progress - handle errors separately
        try {
          await loadCourseData();
        } catch (loadError) {
          console.warn('Failed to refresh course data after quiz submission:', loadError);
          // Don't set error state here as the quiz submission was successful
        }
        
        setError(''); // Clear any previous errors
      } catch (err: any) {
        console.error('Failed to submit quiz:', err);
        // Only set error if the actual quiz submission failed
        if (err.response?.status !== 200) {
          setError(err.response?.data?.message || 'Failed to submit quiz. Please try again.');
        }
      }
    };

    if (chapter.type !== 'quiz' || !chapter.questions?.length) {
      return null;
    }

    // Check if all questions are answered
    const allQuestionsAnswered = chapter.questions.every((q: any) => answers[q._id]?.trim());

    return (
      <div className="mt-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quiz ({chapter.questions.length} question{chapter.questions.length !== 1 ? 's' : ''})
        </h4>

        {!submitted && (
          <>
            {chapter.questions.map((question: any, index: number) => (
              <div key={question._id} className="mb-6 p-4 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                  Question {index + 1}: {question.questionText}
                </h5>

                {question.type === 'mcq' && (
                  <div className="space-y-2">
                    {question.options?.map((option: string, optionIndex: number) => (
                      <label key={optionIndex} className="flex items-center">
                        <input
                          type="radio"
                          name={`question-${question._id}`}
                          value={option}
                          checked={answers[question._id] === option}
                          onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                          className="mr-2"
                          disabled={submitted}
                        />
                        <span className="text-gray-700 dark:text-gray-300">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'fill-in-blank' && (
                  <input
                    type="text"
                    value={answers[question._id] || ''}
                    onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                    disabled={submitted}
                    placeholder="Fill in the blank..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                )}

                {question.type === 'text' && (
                  <textarea
                    value={answers[question._id] || ''}
                    onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                    disabled={submitted}
                    placeholder="Enter your answer..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows={4}
                  />
                )}
              </div>
            ))}

            <div className="mt-4">
              <button
                onClick={handleSubmitQuiz}
                disabled={!allQuestionsAnswered}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Quiz
              </button>
            </div>
          </>
        )}

        {submitted && result && (
          <div className="mt-4 p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Quiz Results</h5>
            
            {/* Main Score Display */}
            <div className="text-center mb-4 p-4 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
              <div className="text-4xl font-bold mb-2">
                <span className={`${(result.score >= 60) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {result.score || 0}%
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {result.correctAnswers || 0} out of {result.totalQuestions || chapter.questions.length} correct
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    (result.score || 0) >= 60 ? 'bg-green-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${result.score || 0}%` }}
                ></div>
              </div>
              
              {/* Pass/Fail Badge */}
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                (result.score >= 60) ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              }`}>
                {(result.score >= 60) ? '✓ PASSED' : '✗ FAILED'} (60% required)
              </div>
            </div>

            {/* Course Progress Update */}
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Course Progress:</span>
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                  {Math.round(result.progress?.overallProgress || 0)}%
                </span>
              </div>
              <div className="w-full bg-indigo-200 dark:bg-indigo-800 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${result.progress?.overallProgress || 0}%` }}
                ></div>
              </div>
            </div>
            
            {/* Detailed Question Results */}
            {result.results && result.results.length > 0 && (
              <div className="mt-4 space-y-2">
                <h6 className="font-medium text-gray-900 dark:text-white mb-2">Question Breakdown:</h6>
                {result.results.map((questionResult: any, index: number) => {
                  const question = chapter.questions.find((q: any) => q._id === questionResult.questionId);
                  return (
                    <div key={questionResult.questionId} className={`p-3 rounded border ${
                      questionResult.isCorrect 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Q{index + 1}: {question?.questionText}
                          </p>
                          <p className="text-xs mt-1">
                            <span className={`font-medium ${
                              questionResult.isCorrect 
                                ? 'text-green-700 dark:text-green-300' 
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              Your answer: {questionResult.userAnswer}
                            </span>
                          </p>
                          {!questionResult.isCorrect && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              <span className="font-medium">Correct answer: {questionResult.correctAnswer}</span>
                            </p>
                          )}
                        </div>
                        <div className={`ml-3 px-2 py-1 rounded text-xs font-medium ${
                          questionResult.isCorrect 
                            ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' 
                            : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                        }`}>
                          {questionResult.isCorrect ? '✓' : '✗'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Course Completion Celebration */}
            {result.progress?.overallProgress === 100 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-green-700 dark:text-green-300 font-bold text-lg">Congratulations!</p>
                  <p className="text-green-600 dark:text-green-400 text-sm">You've completed the entire course!</p>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setResult(null);
                  setAnswers({});
                }}
                className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-400 transition-colors"
              >
                Retake Quiz
              </button>
              
              {result.progress?.overallProgress === 100 && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getEmbedUrl = (url: string) => {
    // Convert YouTube watch URLs to embed URLs
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Convert YouTube short URLs
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Convert Vimeo URLs
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    // Return original URL if it's already an embed URL or other format
    return url;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="text-slate-600 dark:text-gray-300 mt-4 font-medium">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!progress && course) {
    // Show enrollment page
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Debugging info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <p>User ID: {user?._id}</p>
              <p>Course ID: {courseId}</p>
              <p>Auth Status: {user ? 'Logged In' : 'Not Logged In'}</p>
              <button 
                onClick={async () => {
                  // Force enrollment for testing
                  try {
                    await courseAPI.enrollCourse(courseId);
                    loadCourseData();
                  } catch (err) {
                    console.error("Force enrollment failed:", err);
                  }
                }}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
              >
                Force Enrollment
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">{course.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{sections.length}</div>
                    <div className="text-gray-600">Sections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {sections.reduce((total, section) => total + (section.units?.length || 0), 0)}
                    </div>
                    <div className="text-gray-600">Units</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {sections.reduce((total, section) => 
                        total + (section.units?.reduce((unitTotal, unit) => 
                          unitTotal + (unit.chapters?.length || 0), 0) || 0), 0)}
                    </div>
                    <div className="text-gray-600">Chapters</div>
                  </div>
                </div>

                <button
                  onClick={handleEnroll}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Enroll in Course
                </button>
              </div>
            </div>
          </div>

          {/* Course Preview */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
            </div>
            <div className="p-6">
              {sections.map((section, sectionIndex) => (
                <div key={section._id} className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {sectionIndex + 1}. {section.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{section.description}</p>
                  
                  {section.units?.map((unit, unitIndex) => (
                    <div key={unit._id} className="ml-4 mb-3">
                      <h4 className="text-md font-medium text-gray-800">
                        {sectionIndex + 1}.{unitIndex + 1} {unit.title}
                      </h4>
                      <p className="text-gray-600 text-sm">{unit.description}</p>
                      
                      {unit.chapters?.map((chapter, chapterIndex) => (
                        <div key={chapter._id} className="ml-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {sectionIndex + 1}.{unitIndex + 1}.{chapterIndex + 1} {chapter.title}
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                              {chapter.type}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show learning interface
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar - Fixed full height */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen sticky top-0">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {course?.title}
              </h1>
              <Link
                href="/dashboard"
                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                ← Back to Dashboard
              </Link>
            </div>
            
            {/* Progress Bar */}
            {progress && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <span>Progress</span>
                  <span>
                    {/* Force display the actual value */}
                    {progress.completed ? '100%' : `${Math.round(progress.overallProgress || 0)}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: progress.completed ? '100%' : `${Math.round(progress.overallProgress || 0)}%` 
                    }}
                  ></div>
                </div>
                
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mt-1">
                    Raw: {progress.overallProgress} | Completed: {progress.completed ? 'true' : 'false'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scrollable Course Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {sectionIndex + 1}. {section.title}
                  </h3>
                  
                  {section.units?.map((unit, unitIndex) => (
                    <div key={unitIndex} className="ml-2 space-y-1">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                        {sectionIndex + 1}.{unitIndex + 1} {unit.title}
                      </h4>
                      
                      {unit.chapters?.map((chapter, chapterIndex) => {
                        const isCompleted = progress?.sectionsProgress?.some(sp => 
                          sp.unitsProgress?.some(up => 
                            up.chaptersProgress?.some(cp => 
                              cp.chapterId === chapter._id && cp.completed === true
                            )
                          )
                        );
                        
                        return (
                          <button
                            key={chapterIndex}
                            onClick={() => handleChapterSelect(chapter)}
                            className={`block w-full text-left text-sm p-3 rounded-lg ml-4 mb-2 transition-all duration-200 ${
                              currentChapter?._id === chapter._id 
                                ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-500 shadow-sm' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {sectionIndex + 1}.{unitIndex + 1}.{chapterIndex + 1} {chapter.title}
                              </span>
                              {isCompleted && (
                                <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 capitalize mt-1">
                              {chapter.type} {isCompleted && '• Completed'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Content Header */}
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
            {currentChapter && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentChapter.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1 capitalize">
                  {currentChapter.type} Content
                </p>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 p-6">
            {currentChapter ? (
              <div className="max-w-4xl mx-auto">
                {/* Your existing chapter content rendering logic goes here */}
                {currentChapter.type === 'text' && (
                  <div className="mb-6">
                    <div 
                      className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 max-h-96 overflow-y-auto p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
                      onScroll={handleTextScroll}
                      style={{
                        // Force minimum height for very short content
                        minHeight: currentChapter.content && currentChapter.content.length < 500 ? '150px' : 'auto'
                      }}
                    >
                      {currentChapter.content}
                    </div>
                    
                    {/* Show completion status or button */}
                    <div className="mt-4">
                      {isCurrentChapterCompleted() ? (
                        <div className="flex items-center space-x-2">
                          <div className="px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-700">
                            ✓ Chapter Completed
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">You can continue reading anytime</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {canMarkCompleted 
                              ? "You've read the content. Click to mark as completed." 
                              : currentChapter.content && currentChapter.content.length < 500
                                ? "Please wait a moment to ensure you've read the content..."
                                : "Scroll through the content to enable completion."}
                          </p>
                          
                          {/* Always show the button, but disable it based on conditions */}
                          <button
                            onClick={handleMarkCompleted}
                            disabled={!canMarkCompleted || loading || isCurrentChapterCompleted()}
                            className={`px-4 py-2 rounded-md transition-colors ${
                              canMarkCompleted && !loading && !isCurrentChapterCompleted()
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {loading ? 'Marking Complete...' : 
                             isCurrentChapterCompleted() ? 'Already Completed' :
                             canMarkCompleted ? 'Mark as Completed' : 
                             currentChapter.content && currentChapter.content.length < 500 ? 'Reading...' : 'Read Content First'}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Debug info for short content */}
                    {process.env.NODE_ENV === 'development' && currentChapter.content && (
                      <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/20 text-xs rounded">
                        <div><strong>Debug Info:</strong></div>
                        <div>Content Length: {currentChapter.content.length} characters</div>
                        <div>Word Count: {currentChapter.content.split(' ').length} words</div>
                        <div>Strategy: {currentChapter.content.length < 500 ? 'Timer-based (short content)' : 'Scroll-based (long content)'}</div>
                        <div>Can Mark Completed: {canMarkCompleted ? 'Yes' : 'No'}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Video Content */}
                {currentChapter.type === 'video' && currentChapter.videoUrl && (
                  <div className="mb-6">
                    <div className="aspect-w-16 aspect-h-9">
                      <iframe
                        src={getEmbedUrl(currentChapter.videoUrl)}
                        title={currentChapter.title}
                        className="w-full h-64 rounded-lg"
                        allowFullScreen
                        onLoad={() => {
                          console.log('Video loaded');
                          // Only set timer if chapter is NOT already completed
                          if (!isCurrentChapterCompleted()) {
                            console.log('Chapter not completed, starting 30 second timer');
                            setTimeout(() => {
                              // Double-check it's still not completed before enabling
                              if (!isCurrentChapterCompleted()) {
                                console.log('30 seconds passed, enabling completion button');
                                setCanMarkCompleted(true);
                              } else {
                                console.log('Chapter was completed during timer, not enabling button');
                              }
                            }, 30000); // 30 seconds
                          } else {
                            console.log('Chapter already completed, not starting timer');
                          }
                        }}
                      />
                    </div>
                    
                    {/* Show completion status or button */}
                    <div className="mt-4">
                      {isCurrentChapterCompleted() ? (
                        <div className="flex items-center space-x-2">
                          <div className="px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-700">
                            ✓ Chapter Completed
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">You can rewatch this video anytime</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Watch the video and click "Mark as Completed" when finished.
                          </p>
                          {canMarkCompleted ? (
                            <button
                              onClick={handleMarkCompleted}
                              disabled={loading}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? 'Marking Complete...' : 'Mark as Completed'}
                            </button>
                          ) : (
                            <div className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed">
                              Please wait... (30s)
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Content */}
                {currentChapter.type === 'audio' && currentChapter.audioUrl && (
                  <div className="mb-6">
                    <audio 
                      controls 
                      className="w-full"
                      onEnded={handleAudioEnd}
                      onLoadedData={() => {
                        // Allow marking as completed immediately for audio
                        if (!isCurrentChapterCompleted()) {
                          setCanMarkCompleted(true);
                        }
                      }}
                    >
                      <source src={currentChapter.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    
                    {/* Show completion status or button */}
                    <div className="mt-4">
                      {isCurrentChapterCompleted() ? (
                        <div className="flex items-center space-x-2">
                          <div className="px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-700">
                            ✓ Chapter Completed
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Moving to next chapter...</span>
                        </div>
                      ) : (
                        canMarkCompleted && !loading && (
                          <button
                            onClick={handleMarkCompleted}
                            disabled={loading || isCurrentChapterCompleted()}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Marking Complete...' : 'Mark as Completed'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Quiz Content */}
                <QuestionInterface chapter={currentChapter} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select a Chapter
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a chapter from the sidebar to begin learning
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Results Modal */}
      <QuizResultsModal
        isOpen={showQuizResultsModal}
        onClose={() => setShowQuizResultsModal(false)}
        result={quizModalResult}
        chapter={currentChapter}
      />

      {/* Course Completion Modal */}
      <CourseCompletionModal 
        isOpen={showCompletionModal} 
        onClose={() => setShowCompletionModal(false)} 
        courseName={course?.title || 'this course'}
      />
    </div>
  );
}
