import React, { useEffect, useState } from 'react';
import {
  Grid,
  Box,
  Card,
  Typography,
  Stack,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import PageContainer from 'src/components/container/PageContainer';
import { IconMail, IconUser, IconSchool, IconTrophy, IconEdit, IconDeviceFloppy } from '@tabler/icons-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { setCredentials } from 'src/slices/authSlice';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const CLASSES = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Graduate'];

const UserProfile = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    department: userInfo?.department || 'Computer Science',
    class: userInfo?.class || 'First Year',
    rollNo: userInfo?.rollNo || '',
    college: userInfo?.college || '',
  });

  useEffect(() => {
    const fetchUserResults = async () => {
      try {
        setLoading(true);
        
        // Fetch user results
        const { data: resultsData } = await axios.get('/api/users/results/user');
        
        // Fetch all exams to get exam names
        const { data: examsData } = await axios.get('/api/users/exam');
        
        // Create a map of examId (UUID) to exam details
        const examMap = {};
        examsData.forEach((exam) => {
          examMap[exam.examId] = exam;
        });
        
        setExams(examMap);
        setResults(resultsData.data || []);
      } catch (error) {
        console.error('Error fetching results:', error);
        toast.error('Failed to load exam results');
      } finally {
        setLoading(false);
      }
    };

    fetchUserResults();
  }, []);

  const handleSaveProfile = async () => {
    try {
      console.log('💾 Saving profile data:', profileData);
      const response = await axios.put('/api/users/profile', {
        _id: userInfo._id,
        ...profileData,
      });
      
      console.log('✅ Profile saved successfully:', response.data);
      dispatch(setCredentials(response.data));
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'primary';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  return (
    <PageContainer title="User Profile" description="View your profile and exam history">
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {/* Profile Card */}
        <Card elevation={3} sx={{ p: 4, mb: 4 }}>
          <Stack direction="row" spacing={3} alignItems="flex-start">
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'primary.main',
                fontSize: '2.5rem',
              }}
            >
              {userInfo?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              {!editMode ? (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h3">{userInfo?.name}</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<IconEdit />}
                      onClick={() => setEditMode(true)}
                    >
                      Edit Profile
                    </Button>
                  </Stack>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconMail size={20} />
                      <Typography variant="body1" color="textSecondary">
                        {userInfo?.email}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconSchool size={20} />
                      <Typography variant="body1" color="textSecondary" component="div">
                        Role: <Chip label={userInfo?.role} size="small" color="primary" />
                      </Typography>
                    </Stack>
                    {userInfo?.role === 'student' && (
                      <>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" color="textSecondary">
                            Department: <strong>{userInfo?.department || 'Not set'}</strong>
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" color="textSecondary">
                            Class: <strong>{userInfo?.class || 'Not set'}</strong>
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" color="textSecondary">
                            Roll No: <strong>{userInfo?.rollNo || 'Not set'}</strong>
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" color="textSecondary">
                            College: <strong>{userInfo?.college || 'Not set'}</strong>
                          </Typography>
                        </Stack>
                      </>
                    )}
                  </Stack>
                </>
              ) : (
                <Box>
                  <Typography variant="h4" mb={3}>Edit Profile</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={profileData.email}
                        disabled
                      />
                    </Grid>
                    {userInfo?.role === 'student' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Department</InputLabel>
                            <Select
                              value={profileData.department}
                              label="Department"
                              onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                            >
                              {DEPARTMENTS.map((dept) => (
                                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Class</InputLabel>
                            <Select
                              value={profileData.class}
                              label="Class"
                              onChange={(e) => setProfileData({ ...profileData, class: e.target.value })}
                            >
                              {CLASSES.map((cls) => (
                                <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Roll Number"
                            value={profileData.rollNo}
                            onChange={(e) => setProfileData({ ...profileData, rollNo: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="College"
                            value={profileData.college}
                            onChange={(e) => setProfileData({ ...profileData, college: e.target.value })}
                          />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          startIcon={<IconDeviceFloppy />}
                          onClick={handleSaveProfile}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setEditMode(false)}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Stack>
        </Card>

        {/* Exam Results Section */}
        {userInfo?.role === 'student' && (
          <Card elevation={3} sx={{ p: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
              <IconTrophy size={28} />
              <Typography variant="h4">Exam History</Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : results.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="h6" color="textSecondary">
                  No exam results yet
                </Typography>
                <Typography variant="body2" color="textSecondary" mt={1}>
                  Your completed exams will appear here
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.light' }}>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Exam Name
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          Score
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          Percentage
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          Grade
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          Date
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => {
                      const exam = exams[result.examId];
                      const percentage = result.percentage || 0;
                      
                      return (
                        <TableRow key={result._id} hover>
                          <TableCell>
                            <Typography variant="body1" fontWeight={500}>
                              {exam?.examName || 'Unknown Exam'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body1">
                              {result.totalMarks?.toFixed(2) || 0}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${percentage.toFixed(2)}%`}
                              color={getGradeColor(percentage)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={getGrade(percentage)}
                              color={getGradeColor(percentage)}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="textSecondary">
                              {new Date(result.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}
      </Box>
    </PageContainer>
  );
};

export default UserProfile;
