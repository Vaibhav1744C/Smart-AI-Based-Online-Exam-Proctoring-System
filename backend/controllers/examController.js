import asyncHandler from "express-async-handler";
import Exam from "./../models/examModel.js";

// @desc Get all exams (filtered by student's department and class)
// @route GET /api/exams
// @access Public
const getExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find();
  const now = new Date();
  
  // If user is logged in and is a student, filter exams
  if (req.user && req.user.role === 'student') {
    const studentDept = req.user.department;
    const studentClass = req.user.class;
    
    const filteredExams = exams.filter(exam => {
      const deptMatch = exam.allowedDepartments.includes('All') || exam.allowedDepartments.includes(studentDept);
      const classMatch = exam.allowedClasses.includes('All') || exam.allowedClasses.includes(studentClass);
      const isLive = new Date(exam.liveDate) <= now && new Date(exam.deadDate) >= now;
      return deptMatch && classMatch && isLive;
    });
    
    console.log(`Filtered ${filteredExams.length} exams for student (${studentDept}, ${studentClass})`);
    res.status(200).json(filteredExams);
  } else {
    // Teachers see all exams
    res.status(200).json(exams);
  }
});

// @desc Create a new exam
// @route POST /api/exams
// @access Private (admin)
const createExam = asyncHandler(async (req, res) => {
  const { examName, totalQuestions, duration, liveDate, deadDate, allowedDepartments, allowedClasses } = req.body;

  const exam = new Exam({
    examName,
    totalQuestions,
    duration,
    liveDate,
    deadDate,
    allowedDepartments: allowedDepartments || ['All'],
    allowedClasses: allowedClasses || ['All'],
  });

  const createdExam = await exam.save();

  if (createdExam) {
    res.status(201).json(createdExam);
  } else {
    res.status(400);
    throw new Error("Invalid Exam Data");
  }
});

const DeleteExamById = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const exam = await Exam.findOneAndDelete({ examId: examId });
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  console.log("deleted exam", exam);
  res.status(200).json(exam);
});

export { getExams, createExam, DeleteExamById };
