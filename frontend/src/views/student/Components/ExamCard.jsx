import * as React from 'react';
import { Box, Typography, Chip, IconButton, LinearProgress, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QuizIcon from '@mui/icons-material/Quiz';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDeleteExamMutation } from 'src/slices/examApiSlice';

// Import background images
import bg1 from '../../../assets/images/backgrounds/6.png'; // Blue
import bg2 from '../../../assets/images/backgrounds/2.png';
import bg3 from '../../../assets/images/backgrounds/3.png';
import bg4 from '../../../assets/images/backgrounds/4.png';
import bg5 from '../../../assets/images/backgrounds/5.png';
import bg6 from '../../../assets/images/backgrounds/1.png'; // Purple

const backgroundImages = [bg1, bg2, bg3, bg4, bg5, bg6];

// Difficulty levels
const difficultyLevels = ['Primary', 'Intermediate', 'Advanced', 'Master', 'Ph.D'];

export default function ExamCard({ exam, isCompleted = false, status = 'active' }) {
  const { examName, duration, totalQuestions, examId } = exam;
  const { userInfo } = useSelector((state) => state.auth);
  const isTeacher = userInfo?.role === 'teacher';
  const [actualQuestionCount, setActualQuestionCount] = React.useState(totalQuestions);
  const [completionPercentage] = React.useState(Math.floor(Math.random() * 30) + 70); // Mock data
  const [deleteExam, { isLoading: isDeleting }] = useDeleteExamMutation();

  const navigate = useNavigate();
  
  // Determine if card should be disabled
  const isDisabled = status === 'expired' || status === 'upcoming';

  // Fetch actual question count
  React.useEffect(() => {
    const fetchQuestionCount = async () => {
      try {
        const response = await fetch(`/api/users/questions/exam/${examId}`, {
          credentials: 'include',
        });
        const questions = await response.json();
        setActualQuestionCount(questions.length);
      } catch (error) {
        console.error('Error fetching question count:', error);
      }
    };
    fetchQuestionCount();
  }, [examId]);

  const handleCardClick = () => {
    if (isTeacher || isDisabled) {
      // Teachers and disabled cards shouldn't navigate
      return;
    }
    if (isCompleted) {
      navigate('/result');
      return;
    }
    navigate(`/exam/${examId}`);
  };

  const handleDeleteExam = async (e) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${examName}"?`)) {
      return;
    }

    try {
      await deleteExam(examId).unwrap();
      toast.success('Exam deleted successfully');
      // Refresh the page to update the exam list
      window.location.reload();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete exam');
    }
  };

  // Select background image and difficulty based on exam
  const bgIndex = examId ? examId.charCodeAt(0) % backgroundImages.length : 0;
  const difficultyIndex = actualQuestionCount ? Math.min(Math.floor(actualQuestionCount / 10), 4) : 0;
  const selectedBg = backgroundImages[bgIndex];

  return (
    <Box
      sx={{
        backgroundColor: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: isDisabled ? '0 2px 8px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: isTeacher || isDisabled ? 'default' : 'pointer',
        height: '100%',
        minHeight: '420px',
        display: 'flex',
        flexDirection: 'column',
        opacity: isDisabled ? 0.7 : 1,
        '&:hover': {
          transform: isTeacher || isDisabled ? 'none' : 'translateY(-8px)',
          boxShadow: isTeacher || isDisabled ? (isDisabled ? '0 2px 8px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.1)') : '0 16px 32px rgba(0,0,0,0.18)',
        },
      }}
      onClick={handleCardClick}
    >
      {/* Background Image Header */}
      <Box
        sx={{
          height: '200px',
          backgroundImage: `url(${selectedBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          p: 2.5,
          filter: isCompleted || isDisabled ? 'grayscale(100%)' : 'none',
          opacity: isCompleted || isDisabled ? 0.8 : 1,
        }}
      >
        {/* Status Badge for upcoming/expired */}
        {status === 'upcoming' && (
          <Chip
            label="Upcoming"
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
            }}
          />
        )}
        {status === 'expired' && (
          <Chip
            label="Expired"
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
            }}
          />
        )}
        
        {/* Only show question count */}
        {actualQuestionCount > 0 && (
          <Chip
            label={actualQuestionCount}
            size="small"
            sx={{
              backgroundColor: '#E0F2FE',
              color: '#0369A1',
              fontWeight: 700,
              fontSize: '15px',
              height: '36px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
              minWidth: '45px',
              backdropFilter: 'blur(10px)',
            }}
          />
        )}
      </Box>

      {/* Card Content */}
      <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Exam Title */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: isCompleted ? '#64748b' : '#1e293b',
            mb: 1.5,
            fontSize: '20px',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '52px',
            letterSpacing: '-0.2px'
          }}
        >
          {examName}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: '#64748b',
            fontSize: '14px',
            mb: 2.5,
            fontWeight: 400,
          }}
        >
          Multiple choice questions exam
        </Typography>

        {/* Metadata Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            mb: 3,
            color: '#64748b',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuizIcon sx={{ fontSize: '20px' }} />
            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 600 }}>
              {actualQuestionCount} Questions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: '20px' }} />
            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 600 }}>
              {duration} Minutes
            </Typography>
          </Box>
        </Box>

        {/* Status Section */}
        <Box sx={{ mt: 'auto' }}>
          {isTeacher ? (
            <Button
              fullWidth={false}
              startIcon={<DeleteIcon />}
              disabled={isDeleting}
              sx={{
                color: '#ef4444',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '15px',
                p: 0,
                justifyContent: 'flex-start',
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#dc2626',
                },
                '&:disabled': {
                  color: '#94a3b8',
                },
              }}
              onClick={handleDeleteExam}
            >
              {isDeleting ? 'Deleting...' : 'Delete Exam'}
            </Button>
          ) : status === 'upcoming' ? (
            <Typography
              sx={{
                color: '#92400E',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Available on {new Date(exam.liveDate).toLocaleDateString()}
            </Typography>
          ) : status === 'expired' ? (
            <Typography
              sx={{
                color: '#991B1B',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Exam ended
            </Typography>
          ) : isCompleted ? (
            <Button
              size="small"
              sx={{
                color: '#3b82f6',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '15px',
                p: 0,
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/result');
              }}
            >
              View Analytics →
            </Button>
          ) : (
            <Button
              fullWidth={false}
              sx={{
                color: '#3b82f6',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '15px',
                p: 0,
                justifyContent: 'flex-start',
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
            >
              Start Test →
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
