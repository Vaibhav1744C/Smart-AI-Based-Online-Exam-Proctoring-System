import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Select,
  MenuItem,
  Paper,
  Typography,
  IconButton,
  Chip,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useCreateQuestionMutation, useGetExamsQuery, useGetQuestionsQuery } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';

const AddQuestionFormRefactored = () => {
  // Existing API hooks
  const [createQuestion] = useCreateQuestionMutation();
  const { data: examsData } = useGetExamsQuery();

  // State management
  const [selectedExamId, setSelectedExamId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    id: null,
    question: '',
    questionType: 'mcq',
    ansmarks: 1,
    difficulty: 'medium',
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ],
    modelAnswer: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadedFromDB, setLoadedFromDB] = useState(false);

  // Fetch existing questions from database
  const { data: dbQuestions, refetch: refetchQuestions } = useGetQuestionsQuery(selectedExamId, {
    skip: !selectedExamId,
  });

  // Initialize exam selection (FIXED: removed selectedExamId from dependencies to prevent loop)
  useEffect(() => {
    // First check if we have a saved exam ID in localStorage
    const savedExamId = localStorage.getItem('selectedExamId');
    
    if (savedExamId && examsData?.some(exam => exam.examId === savedExamId)) {
      // Use the saved exam ID if it's still valid
      setSelectedExamId(savedExamId);
    } else if (examsData && examsData.length > 0) {
      // Otherwise use the first exam
      setSelectedExamId(examsData[0].examId);
      localStorage.setItem('selectedExamId', examsData[0].examId);
    }
  }, [examsData]); // FIXED: Removed selectedExamId from dependencies

  // Save selected exam ID whenever it changes
  useEffect(() => {
    if (selectedExamId) {
      localStorage.setItem('selectedExamId', selectedExamId);
    }
  }, [selectedExamId]);

  // Load draft from localStorage when exam changes
  useEffect(() => {
    if (!selectedExamId) return;

    const draftKey = `examDraft_${selectedExamId}`;
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.questions && draft.questions.length > 0) {
          // Load the draft questions
          setQuestions(draft.questions);
          setHasUnsavedChanges(true);
          setLoadedFromDB(false);
        } else {
          // No draft for this exam - try loading from DB
          setLoadedFromDB(false);
          setQuestions([]);
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
        setLoadedFromDB(false);
        setQuestions([]);
        setHasUnsavedChanges(false);
      }
    } else {
      // No draft exists - try loading from DB
      setLoadedFromDB(false);
      setQuestions([]);
      setHasUnsavedChanges(false);
    }
  }, [selectedExamId]);

  // Load existing questions from database if no draft exists
  useEffect(() => {
    if (!selectedExamId || loadedFromDB || questions.length > 0) return;
    
    if (dbQuestions && dbQuestions.length > 0) {
      // Transform DB questions to match our local format
      const transformedQuestions = dbQuestions.map((q) => ({
        id: q._id,
        question: q.question,
        questionType: q.questionType,
        ansmarks: q.ansmarks,
        difficulty: 'medium', // Default as DB doesn't store this yet
        options: q.options || [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ],
        modelAnswer: q.modelAnswer || '',
      }));
      
      setQuestions(transformedQuestions);
      setLoadedFromDB(true);
      setHasUnsavedChanges(false); // Questions from DB are already saved, so no unsaved changes
    }
  }, [dbQuestions, selectedExamId, loadedFromDB, questions.length]);

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    if (!selectedExamId) return;

    const autoSaveInterval = setInterval(() => {
      if (questions.length > 0) {
        const draftKey = `examDraft_${selectedExamId}`;
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            examId: selectedExamId,
            questions: questions,
            lastSaved: new Date().toISOString(),
          })
        );
        console.log('Auto-saved draft to localStorage');
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [questions, selectedExamId]);

  // Warn before leaving page if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved questions. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Validation
  const validateQuestion = (q) => {
    const errors = {};
    
    if (!q.question.trim()) {
      errors.question = 'Question text is required';
    }
    
    if (q.ansmarks <= 0) {
      errors.ansmarks = 'Marks must be greater than 0';
    }
    
    if (q.questionType === 'mcq') {
      const filledOptions = q.options.filter(opt => opt.optionText.trim() !== '');
      if (filledOptions.length < 2) {
        errors.options = 'At least 2 options are required';
      }
      const hasCorrect = q.options.some(opt => opt.isCorrect && opt.optionText.trim() !== '');
      if (!hasCorrect) {
        errors.correctAnswer = 'Please select a correct answer';
      }
    } else if (q.questionType === 'subjective') {
      if (!q.modelAnswer.trim()) {
        errors.modelAnswer = 'Model answer is required for subjective questions';
      }
    }
    
    return errors;
  };

  // Handle option change
  const handleOptionChange = (index, field, value) => {
    const newOptions = [...currentQuestion.options];
    if (field === 'isCorrect') {
      // Only one correct answer for MCQ
      newOptions.forEach((opt, idx) => {
        opt.isCorrect = idx === index;
      });
    } else {
      newOptions[index][field] = value;
    }
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  // Add new option
  const handleAddOption = () => {
    if (currentQuestion.options.length < 8) {
      setCurrentQuestion({
        ...currentQuestion,
        options: [...currentQuestion.options, { optionText: '', isCorrect: false }],
      });
    }
  };

  // Remove option
  const handleRemoveOption = (index) => {
    if (currentQuestion.options.length > 2) {
      const newOptions = currentQuestion.options.filter((_, idx) => idx !== index);
      setCurrentQuestion({ ...currentQuestion, options: newOptions });
    }
  };

  // Save question to LOCAL STATE (not database yet)
  const handleSaveQuestion = () => {
    const errors = validateQuestion(currentQuestion);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix validation errors');
      return;
    }

    if (currentQuestion.id) {
      // Update existing question in local state
      setQuestions(questions.map(q => q.id === currentQuestion.id ? { ...currentQuestion } : q));
      toast.success('Question updated in draft');
    } else {
      // Add new question to local state
      const newQuestion = { ...currentQuestion, id: Date.now() };
      setQuestions([...questions, newQuestion]);
      toast.success('Question added to draft');
    }

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

    // Save to localStorage immediately
    const draftKey = `examDraft_${selectedExamId}`;
    const updatedQuestions = currentQuestion.id 
      ? questions.map(q => q.id === currentQuestion.id ? { ...currentQuestion } : q)
      : [...questions, { ...currentQuestion, id: Date.now() }];
    
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        examId: selectedExamId,
        questions: updatedQuestions,
        lastSaved: new Date().toISOString(),
      })
    );

    // Reset form for new question
    setCurrentQuestion({
      id: null,
      question: '',
      questionType: 'mcq',
      ansmarks: 1,
      difficulty: 'medium',
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ],
      modelAnswer: '',
    });
    setSelectedQuestionId(null);
    setValidationErrors({});
  };

  // Select question for editing
  const handleSelectQuestion = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      setCurrentQuestion({ ...question });
      setSelectedQuestionId(questionId);
      setValidationErrors({});
    }
  };

  // Delete question
  const handleDeleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(null);
      setCurrentQuestion({
        id: null,
        question: '',
        questionType: 'mcq',
        ansmarks: 1,
        difficulty: 'medium',
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ],
        modelAnswer: '',
      });
    }
    toast.info('Question deleted');
  };

  // Create new question
  const handleNewQuestion = () => {
    setCurrentQuestion({
      id: null,
      question: '',
      questionType: 'mcq',
      ansmarks: 1,
      difficulty: 'medium',
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ],
      modelAnswer: '',
    });
    setSelectedQuestionId(null);
    setValidationErrors({});
  };

  // Publish all questions to database (BATCH SAVE)
  const handleSaveExam = async () => {
    if (questions.length === 0) {
      toast.error('Please add at least one question before publishing');
      return;
    }

    setIsPublishing(true);

    try {
      // Batch save all questions to database
      const savePromises = questions.map(async (q) => {
        const payload = {
          examId: selectedExamId,
          question: q.question,
          questionType: q.questionType,
          ansmarks: q.ansmarks,
        };

        if (q.questionType === 'mcq') {
          payload.options = q.options
            .filter(opt => opt.optionText.trim() !== '')
            .map(opt => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
            }));
        } else {
          payload.modelAnswer = q.modelAnswer;
        }

        return createQuestion(payload).unwrap();
      });

      await Promise.all(savePromises);

      // Success! Clear draft and reset state
      const draftKey = `examDraft_${selectedExamId}`;
      localStorage.removeItem(draftKey);
      
      toast.success(`Exam published successfully!`);
      
      setHasUnsavedChanges(false);
      setQuestions([]);
      setLoadedFromDB(false); // Reset flag to reload from DB
      setCurrentQuestion({
        id: null,
        question: '',
        questionType: 'mcq',
        ansmarks: 1,
        difficulty: 'medium',
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ],
        modelAnswer: '',
      });
      setSelectedQuestionId(null);
      
      // Refetch questions from database to show published questions
      refetchQuestions();
    } catch (error) {
      console.error('Failed to publish exam:', error);
      toast.error('Failed to publish exam. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Discard draft
  const handleDiscardDraft = () => {
    if (window.confirm('Are you sure you want to discard all unsaved questions?')) {
      const draftKey = `examDraft_${selectedExamId}`;
      localStorage.removeItem(draftKey);
      
      setQuestions([]);
      setCurrentQuestion({
        id: null,
        question: '',
        questionType: 'mcq',
        ansmarks: 1,
        difficulty: 'medium',
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ],
        modelAnswer: '',
      });
      setSelectedQuestionId(null);
      setHasUnsavedChanges(false);
      
      toast.info('Draft discarded');
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: 'grey.100' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>
              Question Builder {hasUnsavedChanges && <Chip label="Draft" size="small" color="warning" sx={{ ml: 1 }} />}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 300 }}>
                <Select
                  value={selectedExamId}
                  onChange={(e) => {
                    const newExamId = e.target.value;
                    
                    // Warn if switching with unsaved changes
                    if (hasUnsavedChanges && currentQuestion.question) {
                      if (!window.confirm('Switching exams will reset the current question form. Continue?')) {
                        return;
                      }
                    }
                    
                    setSelectedExamId(newExamId);
                    setLoadedFromDB(false); // Reset flag when switching exams
                    
                    // Reset current question when switching exams
                    setCurrentQuestion({
                      id: null,
                      question: '',
                      questionType: 'mcq',
                      ansmarks: 1,
                      difficulty: 'medium',
                      options: [
                        { optionText: '', isCorrect: false },
                        { optionText: '', isCorrect: false },
                        { optionText: '', isCorrect: false },
                        { optionText: '', isCorrect: false },
                      ],
                      modelAnswer: '',
                    });
                    setSelectedQuestionId(null);
                    setValidationErrors({});
                  }}
                  displayEmpty
                >
                  {examsData?.map((exam) => (
                    <MenuItem key={exam.examId} value={exam.examId}>
                      {exam.examName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Chip
                label={`${questions.length} Questions`}
                color="primary"
                variant="outlined"
              />
              
            </Stack>
          </Box>
          <Stack direction="row" spacing={2}>
            {hasUnsavedChanges && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleDiscardDraft}
                disabled={isPublishing}
                sx={{ borderRadius: '8px' }}
              >
                Discard Draft
              </Button>
            )}
            <Button
              variant="contained"
              size="large"
              onClick={handleSaveExam}
              disabled={questions.length === 0 || isPublishing}
              sx={{ borderRadius: '8px' }}
            >
              {isPublishing ? 'Publishing...' : 'Publish Exam'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* 3-Column Layout */}
      <Box sx={{ display: 'flex', gap: 2, flex: 1, overflow: 'hidden' }}>
        {/* Column 1: Question List */}
        <Paper
          elevation={0}
          sx={{
            width: '20%',
            p: 2,
            borderRadius: '12px',
            overflow: 'auto',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Questions
          </Typography>

          {questions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No questions yet. Use the form to create your first question.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {questions.map((q, index) => (
              <Card
                key={q.id}
                elevation={0}
                sx={{
                  cursor: 'pointer',
                  border: selectedQuestionId === q.id ? 2 : 1,
                  borderColor: selectedQuestionId === q.id ? 'primary.main' : 'divider',
                  bgcolor: selectedQuestionId === q.id ? 'primary.light' : 'background.paper',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: selectedQuestionId === q.id ? 'primary.light' : 'grey.100',
                  },
                }}
                onClick={() => handleSelectQuestion(q.id)}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Q{index + 1}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {q.questionType.toUpperCase()} • {q.ansmarks} {q.ansmarks === 1 ? 'Mark' : 'Marks'}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(q.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
          )}
        </Paper>

        {/* Column 2: Question Editor */}
        <Paper
          elevation={0}
          sx={{
            width: '50%',
            p: 3,
            pb: 4,
            borderRadius: '12px',
            overflow: 'auto',
            bgcolor: 'background.paper',
            boxShadow: 'inset 0 -8px 10px -6px rgba(0, 0, 0, 0.15)',
            // Make scrollbar more visible
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            },
          }}
        >
          <Typography variant="h5" sx={{ mb: 3 }}>
            {currentQuestion.id ? 'Edit Question' : 'Create New Question'}
          </Typography>

          <Stack spacing={3}>
            {/* Question Type & Marks */}
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={currentQuestion.questionType}
                  label="Question Type"
                  onChange={(e) =>
                    setCurrentQuestion({ ...currentQuestion, questionType: e.target.value })
                  }
                >
                  <MenuItem value="mcq">Multiple Choice (MCQ)</MenuItem>
                  <MenuItem value="subjective">Subjective (Essay)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Marks"
                type="number"
                value={currentQuestion.ansmarks}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, ansmarks: Number(e.target.value) })
                }
                error={!!validationErrors.ansmarks}
                helperText={validationErrors.ansmarks}
                sx={{ width: '150px' }}
                inputProps={{ min: 1 }}
              />

              <FormControl sx={{ width: '150px' }}>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={currentQuestion.difficulty}
                  label="Difficulty"
                  onChange={(e) =>
                    setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value })
                  }
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Question Text */}
            <TextField
              label="Question Text"
              multiline
              rows={4}
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
              error={!!validationErrors.question}
              helperText={validationErrors.question}
              fullWidth
              required
            />

            {/* MCQ Options */}
            {currentQuestion.questionType === 'mcq' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Options (select the correct answer)
                </Typography>
                <Stack spacing={2}>
                  {currentQuestion.options.map((option, index) => (
                    <Stack
                      key={index}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        border: 1,
                        borderColor: option.isCorrect ? 'success.main' : 'divider',
                        bgcolor: option.isCorrect ? 'success.light' : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: option.isCorrect ? 'success.light' : 'grey.100',
                        },
                      }}
                    >
                      <Radio
                        checked={option.isCorrect}
                        onChange={() => handleOptionChange(index, 'isCorrect', true)}
                        sx={{
                          color: option.isCorrect ? 'success.main' : 'default',
                        }}
                      />
                      <TextField
                        placeholder={`Option ${index + 1}`}
                        value={option.optionText}
                        onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                        fullWidth
                        size="small"
                        variant="outlined"
                      />
                      {option.isCorrect ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Correct Answer"
                          color="success"
                          size="small"
                          sx={{ minWidth: '140px' }}
                        />
                      ) : (
                        <Box
                          onClick={() => handleOptionChange(index, 'isCorrect', true)}
                          sx={{
                            minWidth: '140px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            py: 0.5,
                            px: 1,
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'primary.light',
                              color: 'primary.main',
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="inherit"
                            sx={{ fontWeight: 500 }}
                          >
                            Mark as correct
                          </Typography>
                        </Box>
                      )}
                      {currentQuestion.options.length > 2 && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveOption(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Stack>
                  ))}
                </Stack>

                {validationErrors.options && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {validationErrors.options}
                  </Alert>
                )}
                {validationErrors.correctAnswer && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {validationErrors.correctAnswer}
                  </Alert>
                )}

                {currentQuestion.options.length < 8 && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddOption}
                    sx={{ mt: 2 }}
                    variant="outlined"
                    size="small"
                  >
                    Add Option
                  </Button>
                )}
              </Box>
            )}

            {/* Subjective Model Answer */}
            {currentQuestion.questionType === 'subjective' && (
              <TextField
                label="Model Answer (for AI Grading)"
                multiline
                rows={6}
                value={currentQuestion.modelAnswer}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, modelAnswer: e.target.value })
                }
                error={!!validationErrors.modelAnswer}
                helperText={validationErrors.modelAnswer}
                fullWidth
                required
              />
            )}

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Button variant="outlined" onClick={handleNewQuestion} sx={{ borderRadius: '8px' }}>
                Clear Form
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveQuestion}
                startIcon={<CheckCircleIcon />}
                sx={{ borderRadius: '8px' }}
              >
                {currentQuestion.id ? 'Update Question' : 'Save Question'}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Column 3: Live Preview */}
        <Paper
          elevation={0}
          sx={{
            width: '30%',
            p: 3,
            borderRadius: '12px',
            overflow: 'auto',
            bgcolor: 'grey.100',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Student View Preview
          </Typography>

          {currentQuestion.question ? (
            <Card elevation={0} sx={{ borderRadius: '8px' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Chip
                        label={currentQuestion.questionType.toUpperCase()}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={`${currentQuestion.ansmarks} ${currentQuestion.ansmarks === 1 ? 'Mark' : 'Marks'}`}
                        size="small"
                        color="secondary"
                      />
                    </Stack>
                    <Typography variant="body1">{currentQuestion.question}</Typography>
                  </Box>

                  <Divider />

                  {currentQuestion.questionType === 'mcq' ? (
                    <RadioGroup>
                      {currentQuestion.options
                        .filter((opt) => opt.optionText.trim() !== '')
                        .map((option, index) => (
                          <FormControlLabel
                            key={index}
                            value={index}
                            control={<Radio />}
                            label={option.optionText}
                          />
                        ))}
                    </RadioGroup>
                  ) : (
                    <TextField
                      placeholder="Student will type their answer here..."
                      multiline
                      rows={6}
                      fullWidth
                      disabled
                    />
                  )}

                  <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      Estimated Time: {currentQuestion.questionType === 'mcq' ? '1-2' : '3-5'} min
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Preview will appear here as you create your question
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AddQuestionFormRefactored;
