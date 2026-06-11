import React, { useEffect, useState } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import { Container } from '@mui/material';
import { useGetQuestionsQuery } from 'src/slices/examApiSlice';
import { useNavigate, useParams } from 'react-router';
import axiosInstance from '../../../axios';
import { toast } from 'react-toastify';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSelector } from 'react-redux';

export default function MultipleChoiceQuestion({ questions, saveUserTestScore, submitTest, answersRef }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState(new Map());
  const [subjectiveAnswers, setSubjectiveAnswers] = useState({});
  const [hasCodingQuestions, setHasCodingQuestions] = useState(false);
  const navigate = useNavigate();
  const { examId } = useParams();
  const { cheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [isFinishTest, setisFinishTest] = useState(false);

  useEffect(() => {
    console.log('Current question index:', currentQuestion);
    console.log('Total questions:', questions?.length);
    console.log('Current question data:', questions?.[currentQuestion]);
    setIsLastQuestion(currentQuestion === questions.length - 1);
  }, [currentQuestion, questions]);

  // Check if exam has coding questions
  useEffect(() => {
    const checkCodingQuestions = async () => {
      try {
        const response = await axiosInstance.get(`/api/coding/questions/${examId}`, {
          withCredentials: true,
        });
        setHasCodingQuestions(response.data && response.data.length > 0);
      } catch (error) {
        setHasCodingQuestions(false);
      }
    };
    checkCodingQuestions();
  }, [examId]);

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  // Keep answersRef in sync so force-submit can access current answers
  useEffect(() => {
    if (answersRef) {
      answersRef.current = Object.fromEntries(answers);
    }
  }, [answers, answersRef]);

  const handleNextQuestion = async () => {
    const currentQuestionData = questions[currentQuestion];
    
    // Handle MCQ (default if questionType is not set or is 'mcq')
    if (!currentQuestionData.questionType || currentQuestionData.questionType === 'mcq') {
      let isCorrect = false;
      if (currentQuestionData && currentQuestionData.options) {
        const correctOption = currentQuestionData.options.find((option) => option.isCorrect);
        if (correctOption && selectedOption) {
          isCorrect = correctOption._id === selectedOption;
        }
      }

      setAnswers((prev) => {
        const newAnswers = new Map(prev);
        newAnswers.set(currentQuestionData._id, selectedOption);
        return newAnswers;
      });

      if (isCorrect) {
        setScore(score + 1);
        saveUserTestScore();
      }
    } 
    // Handle Subjective
    else if (currentQuestionData.questionType === 'subjective') {
      setSubjectiveAnswers((prev) => ({
        ...prev,
        [currentQuestionData._id]: subjectiveAnswer,
      }));
    }

    if (isLastQuestion) {
      // Save cheating log FIRST before anything else
      try {
        const updatedLog = {
          ...cheatingLog,
          username: userInfo.name,
          email: userInfo.email,
          examId: examId,
          noFaceCount: parseInt(cheatingLog.noFaceCount) || 0,
          multipleFaceCount: parseInt(cheatingLog.multipleFaceCount) || 0,
          cellPhoneCount: parseInt(cheatingLog.cellPhoneCount) || 0,
          prohibitedObjectCount: parseInt(cheatingLog.prohibitedObjectCount) || 0,
          tabSwitchCount: parseInt(cheatingLog.tabSwitchCount) || 0,
        };
        
        console.log('[MCQ] === SAVING CHEATING LOG ===');
        console.log('[MCQ] Data to save:', updatedLog);
        const result = await saveCheatingLogMutation(updatedLog).unwrap();
        console.log('[MCQ] ✓ Cheating log saved successfully. Response:', result);
        console.log('[MCQ] Saved log ID:', result._id);
      } catch (logError) {
        console.error('[MCQ] ✗ Failed to save cheating log');
        console.error('[MCQ] Error:', logError);
        console.error('[MCQ] Error data:', logError.data);
        console.error('[MCQ] Error status:', logError.status);
        toast.error('Failed to save exam logs');
      }

      try {
        const answersObject = Object.fromEntries(answers);
        if (selectedOption && (!currentQuestionData.questionType || currentQuestionData.questionType === 'mcq')) {
          answersObject[currentQuestionData._id] = selectedOption;
        }

        const finalSubjectiveAnswers = { ...subjectiveAnswers };
        if (subjectiveAnswer && currentQuestionData.questionType === 'subjective') {
          finalSubjectiveAnswers[currentQuestionData._id] = subjectiveAnswer;
        }

        await axiosInstance.post(
          '/api/users/results',
          {
            examId,
            answers: answersObject,
            subjectiveAnswers: finalSubjectiveAnswers,
          },
          {
            withCredentials: true,
          },
        );

        // Check if there are coding questions
        try {
          const codingResponse = await axiosInstance.get(`/api/coding/questions/${examId}`, {
            withCredentials: true,
          });
          
          if (codingResponse.data && codingResponse.data.length > 0) {
            // Has coding questions, navigate to coding page
            navigate(`/exam/${examId}/codedetails`);
          } else {
            // No coding questions
            toast.success('Test submitted successfully!');
            navigate('/Success');
          }
        } catch (error) {
          // No coding questions or error
          toast.success('Test submitted successfully!');
          navigate('/Success');
        }
      } catch (error) {
        console.error('Error saving results:', error);
        toast.error('Failed to save results');
      }
    }

    setSelectedOption(null);
    setSubjectiveAnswer('');
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setisFinishTest(true);
    }
  };

  return (
    <Card
      style={{
        width: '50%',
        boxShadow: '2px',
      }}
    >
      <CardContent
        style={{
          boxShadow: '4px',
          padding: '2px',
          paddingRight: '4px',
          margin: '3px',
        }}
      >
        {questions && questions.length > 0 ? (
          <>
            <Typography variant="h4" mb={3}>
              Question {currentQuestion + 1}:
              {questions[currentQuestion]?.questionType === 'subjective' && (
                <Chip label={`${questions[currentQuestion].ansmarks} marks`} color="primary" size="small" sx={{ ml: 2 }} />
              )}
            </Typography>
            <Typography variant="body1" mb={3}>
              {questions[currentQuestion].question}
            </Typography>
            <Box mb={10}>
              {questions[currentQuestion]?.questionType === 'subjective' ? (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Type your answer here..."
                  value={subjectiveAnswer}
                  onChange={(e) => setSubjectiveAnswer(e.target.value)}
                  variant="outlined"
                />
              ) : (
                <FormControl component="fieldset">
                  <RadioGroup
                    aria-label="quiz"
                    name="quiz"
                    value={selectedOption}
                    onChange={handleOptionChange}
                  >
                    {questions[currentQuestion]?.options?.map((option) => (
                      <FormControlLabel
                        key={option._id}
                        value={option._id}
                        control={<Radio />}
                        label={option.optionText}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            </Box>
            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Button
                variant="contained"
                color="primary"
                onClick={handleNextQuestion}
                disabled={
                  questions[currentQuestion]?.questionType === 'subjective'
                    ? subjectiveAnswer.trim() === ''
                    : selectedOption === null
                }
                style={{ marginLeft: 'auto' }}
              >
                {isLastQuestion 
                  ? (hasCodingQuestions ? 'Proceed to Coding' : 'Submit Test')
                  : 'Next Question'}
              </Button>
            </Stack>
          </>
        ) : (
          <Typography>No questions available</Typography>
        )}
      </CardContent>
    </Card>
  );
}
