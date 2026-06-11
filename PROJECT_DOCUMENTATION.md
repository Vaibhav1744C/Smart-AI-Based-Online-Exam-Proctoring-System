# ProctAI – Complete Project Documentation
> Use this file to understand every part of the codebase in detail.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Environment Variables](#4-environment-variables)
5. [Backend – Deep Dive](#5-backend--deep-dive)
   - [server.js](#51-serverjs)
   - [Models](#52-models)
   - [Controllers](#53-controllers)
   - [Routes](#54-routes)
   - [Middleware](#55-middleware)
   - [Utils](#56-utils)
6. [Frontend – Deep Dive](#6-frontend--deep-dive)
   - [Entry Point](#61-entry-point)
   - [Redux Store & Slices](#62-redux-store--slices)
   - [Routing](#63-routing)
   - [Context](#64-context)
   - [Authentication Views](#65-authentication-views)
   - [Student Views](#66-student-views)
   - [Teacher Views](#67-teacher-views)
   - [WebCam Component (Proctoring)](#68-webcam-component-proctoring)
7. [Complete Data Flows](#7-complete-data-flows)
   - [Login Flow](#71-login-flow)
   - [Exam Attempt Flow](#72-exam-attempt-flow)
   - [Proctoring Flow](#73-proctoring-flow)
   - [Grading Flow](#74-grading-flow)
   - [Violation Termination Flow](#75-violation-termination-flow)
8. [Security Features](#8-security-features)
9. [API Endpoints Reference](#9-api-endpoints-reference)
10. [Key Concepts to Understand](#10-key-concepts-to-understand)

---

## 1. Project Overview

ProctAI is a full-stack AI-powered online exam proctoring system. It allows:
- **Teachers** to create exams, add questions (MCQ, subjective, coding), and review student results with cheating logs
- **Students** to attempt exams under real-time AI monitoring via webcam

The AI monitoring detects: no face, multiple faces, looking away, cell phones, books, laptops, tab switching, and fullscreen exit. At 5 violations the exam is auto-submitted.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js 18 | UI framework |
| Frontend State | Redux Toolkit + RTK Query | Global state + API calls |
| Frontend UI | Material UI (MUI) v5 | Component library |
| Frontend AI | TensorFlow.js + COCO-SSD | Object detection in browser |
| Frontend AI | MediaPipe FaceMesh | Face detection + head pose |
| Frontend Editor | Monaco Editor | Code editor for coding questions |
| Frontend Charts | Recharts | Analytics charts |
| Frontend Forms | Formik + Yup | Form validation |
| Backend | Node.js + Express.js | REST API server |
| Database | MongoDB + Mongoose | Data storage + ORM |
| Auth | JWT + bcryptjs | Authentication + password hashing |
| AI Grading | Groq SDK (LLaMA) | Subjective answer grading |
| File Storage | Cloudinary | Screenshot storage |
| Email | Nodemailer (Gmail SMTP) | Result emails |
| Router | React Router v6 | Client-side routing |

---

## 3. Folder Structure

```
root/
├── .env                          # Backend environment variables
├── package.json                  # Root package (runs both servers)
├── backend/
│   ├── server.js                 # Express app entry point
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/                   # Mongoose schemas
│   │   ├── userModel.js
│   │   ├── examModel.js
│   │   ├── quesModel.js
│   │   ├── resultModel.js
│   │   ├── cheatingLogModel.js
│   │   ├── subjectiveResponseModel.js
│   │   └── codingQuestionModel.js
│   ├── controllers/              # Business logic
│   │   ├── userController.js
│   │   ├── examController.js
│   │   ├── quesController.js
│   │   ├── resultController.js
│   │   ├── cheatingLogController.js
│   │   └── codingController.js
│   ├── routes/                   # Express routers
│   │   ├── userRoutes.js
│   │   ├── examRoutes.js
│   │   ├── resultRoutes.js
│   │   └── codingRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   └── errorMiddleware.js    # Error handling
│   └── utils/
│       ├── generateToken.js      # JWT creation
│       ├── groqGrader.js         # AI subjective grading
│       ├── emailService.js       # Email sending
│       └── cloudinaryUpload.js   # Screenshot upload
└── frontend/
    ├── .env                      # Frontend environment variables
    ├── package.json
    └── src/
        ├── index.js              # React entry point
        ├── App.js                # Root component (providers)
        ├── store.js              # Redux store
        ├── axios.js              # Axios instance
        ├── slices/               # Redux slices + RTK Query
        │   ├── apiSlice.js
        │   ├── authSlice.js
        │   ├── examApiSlice.js
        │   ├── usersApiSlice.js
        │   └── cheatingLogApiSlice.js
        ├── context/
        │   └── CheatingLogContext.jsx  # Violation state
        ├── routes/
        │   └── Router.js         # All route definitions
        ├── layouts/              # Page layout wrappers
        └── views/
            ├── authentication/   # Login, Register, PrivateRoute
            ├── student/          # Dashboard, TestPage, WebCam, etc.
            └── teacher/          # CreateExam, AddQuestions, ExamLog
```

---

## 4. Environment Variables

### Backend (`/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://...         # MongoDB Atlas connection string
JWT_SECRET=your_secret              # Used to sign/verify JWT tokens
GROQ_API_KEY=gsk_...               # Groq LLM API for subjective grading
CLOUDINARY_CLOUD_NAME=...          # Cloudinary account name
CLOUDINARY_API_KEY=...             # Cloudinary API key
CLOUDINARY_API_SECRET=...          # Cloudinary secret
EMAIL_USER=...                     # Gmail address for sending emails
EMAIL_PASS=...                     # Gmail App Password (not normal password)
EMAIL_FROM=...                     # From address in emails
```

### Frontend (`/frontend/.env`)
```env
REACT_APP_BACKEND_URL=http://localhost:5000   # Backend URL
REACT_APP_CLOUDINARY_CLOUD_NAME=...           # (legacy, now unused)
REACT_APP_CLOUDINARY_UPLOAD_PRESET=...        # (legacy, now unused)
```
> Note: All `REACT_APP_*` variables are baked in at build time. Restart dev server after changes.

---

## 5. Backend – Deep Dive

### 5.1 `server.js`
The Express app entry point. Does the following in order:
1. Loads `.env` using `dotenv.config()`
2. Calls `connectDB()` to connect to MongoDB
3. Sets up CORS — allows `localhost:3000`, `localhost:5000`, and any `*.vercel.app` URL
4. Registers middleware: `express.json()`, `express.urlencoded()`, `cookieParser()`
5. Registers special routes:
   - `POST /run-python` — writes code to `script.py`, runs with `exec("python script.py")`
   - `POST /run-javascript` — writes code to `script.js`, runs with `exec("node script.js")`
   - `POST /run-java` — writes code to `Main.java`, runs with `exec("javac Main.java && java Main")`
   - `POST /api/upload/screenshot` — receives base64 image, uploads to Cloudinary
6. Registers API routes: `/api/users`, `/api/coding`
7. Adds error middleware last

**Key library**: `cors` for cross-origin, `cookie-parser` for reading JWT from cookies, `child_process.exec` for running student code

---

### 5.2 Models

#### `userModel.js`
```
Fields: name, email, password (hashed), role (student/teacher),
        department, class, rollNo, college, profilePicture
```
- Password is hashed using `bcryptjs` before saving (pre-save hook)
- Has a `matchPassword(enteredPassword)` method that compares hashed passwords
- `role` defaults to `'student'`

#### `examModel.js`
```
Fields: examName, totalQuestions, duration (minutes),
        liveDate, deadDate, examId (UUID string), 
        allowedDepartments (array), allowedClasses (array)
```
- `examId` is auto-generated using `uuid.v4()` — this is a string, NOT a MongoDB ObjectId
- This UUID is used across the system to link questions, results, and cheating logs
- `allowedDepartments` and `allowedClasses` default to `['All']`

#### `quesModel.js`
```
Fields: question (text), questionType (mcq/subjective),
        options (array of {optionText, isCorrect}),
        modelAnswer (for subjective), ansmarks, examId
```
- For MCQ: `options` array contains the correct answer marked with `isCorrect: true`
- For subjective: `modelAnswer` is used by Groq AI to grade student answers

#### `resultModel.js`
```
Fields: examId (string), userId (ObjectId ref User),
        answers (Map<string, string>), totalMarks, percentage,
        showToStudent (boolean), codingMarks, totalScore, feedback,
        gradedBy, gradedAt
```
- `answers` is a MongoDB Map — stores `{ questionId: selectedOptionId }`
- `showToStudent` is `false` by default — teachers control when students see results
- Unique constraint: one result per `examId + userId` combination

#### `cheatingLogModel.js`
```
Fields: totalViolations, noFaceCount, multipleFaceCount,
        cellPhoneCount, prohibitedObjectCount, tabSwitchCount,
        lookingAwayCount, examId, email, username,
        screenshots (array of {url, type, detectedAt})
```
- `screenshots` stores Cloudinary URLs with violation type metadata
- Upserted (update or insert) — one log per student per exam

#### `subjectiveResponseModel.js`
```
Fields: studentEmail, questionId (ref Question), examId,
        studentAnswer, aiScore, aiFeedback, maxMarks, gradedAt
```
- Stores AI grading results separately for detailed review

#### `codingQuestionModel.js`
```
Fields: examId, question, description,
        submittedAnswer {code, language, status, userId, executionTime}
```

---

### 5.3 Controllers

#### `userController.js`

**`authUser(req, res)`** — Login
1. Finds user by email in MongoDB
2. Calls `user.matchPassword(password)` — bcrypt compare
3. If match: calls `generateToken(res, user._id)` to set JWT cookie
4. Returns user data (name, email, role, etc.) — no password

**`registerUser(req, res)`** — Register
1. Checks if email already exists
2. Creates user with `User.create({...})` — password auto-hashed by pre-save hook
3. Calls `generateToken()` and returns user data

**`logoutUser(req, res)`** — Logout
- Sets cookie to empty string with `maxAge: 0` — clears JWT

**`getUserProfile(req, res)`** — Get Profile
- Returns `req.user` (attached by `authMiddleware`)

**`updateUserProfile(req, res)`** — Update Profile
- Updates fields if provided in request body
- Re-hashes password if changed
- Saves and returns updated user

---

#### `examController.js`

**`getExams(req, res)`** — Get Exams
- Fetches all exams from DB
- If student: filters by `allowedDepartments` and `allowedClasses` matching student's profile
- Also filters by `liveDate <= now <= deadDate` for students (only active exams shown)
- Teachers see all exams regardless of dates

**`createExam(req, res)`** — Create Exam
- Creates exam with provided name, duration, dates, and access restrictions
- UUID auto-generated for `examId`

**`DeleteExamById(req, res)`** — Delete Exam
- Finds exam by `examId` string and deletes

---

#### `resultController.js`

**`saveResult(req, res)`** — Save Result (most complex controller)
1. Validates `examId` and `answers` present
2. Checks for existing result — returns 400 if already submitted (prevents re-attempt)
3. Fetches all questions for the exam
4. **MCQ grading**: loops through MCQ questions, compares `answers[questionId]` to `correctOption._id`
5. **Subjective grading**: calls `gradeSubjectiveAnswer()` for each subjective answer
6. Calculates `totalScore = mcqScore + subjectiveScore`
7. Calculates `percentage = (totalScore / maxPossible) * 100`, capped at 100
8. Saves result to DB with `Result.create()`
9. Sends result email to student via `sendResultEmail()`

**`getUserResults(req, res)`** — Student's Results
- Finds results where `userId === req.user._id` AND `showToStudent === true`
- Also fetches coding submissions and subjective responses for each result

**`toggleResultVisibility(req, res)`** — Teacher toggles visibility
- Flips `showToStudent` boolean on a result

---

#### `cheatingLogController.js`

**`saveCheatingLog(req, res)`**
- Uses `findOneAndUpdate` with `upsert: true` — creates or updates log
- Matched by `examId + email` combination
- Saves all violation counts and screenshots array

**`getCheatingLogsByExamId(req, res)`**
- Returns all cheating logs for an exam (for teacher review)

---

### 5.4 Routes

All routes are registered under `/api/users` prefix (except coding which uses `/api/coding`):

```
POST   /api/users              → registerUser
POST   /api/users/auth         → authUser (login)
POST   /api/users/logout       → logoutUser
GET    /api/users/profile      → getUserProfile (protected)
PUT    /api/users/profile      → updateUserProfile (protected)

GET    /api/users/exam                    → getExams (protected)
POST   /api/users/exam                    → createExam (protected)
GET    /api/users/exam/questions/:examId  → getQuestionsByExamId (protected)
POST   /api/users/exam/questions          → createQuestion (protected)
DELETE /api/users/exam/:examId            → DeleteExamById (protected)

POST   /api/users/results               → saveResult (protected)
GET    /api/users/results/user          → getUserResults (protected)
GET    /api/users/results/all           → getAllResults (teacher only)
GET    /api/users/results/exam/:examId  → getResultsByExamId (protected)
PUT    /api/users/results/:id/toggle-visibility → toggleResultVisibility

POST   /api/users/cheatingLogs          → saveCheatingLog (protected)
GET    /api/users/cheatingLogs/:examId  → getCheatingLogsByExamId (protected)

POST   /api/coding/submit               → submitCodingAnswer
POST   /api/coding/question             → createCodingQuestion
GET    /api/coding/questions            → getCodingQuestions
GET    /api/coding/questions/:examId    → getCodingQuestionsByExamId
```

---

### 5.5 Middleware

#### `authMiddleware.js` — `protect(req, res, next)`
1. Reads JWT from `req.cookies.jwt`
2. Verifies with `jwt.verify(token, process.env.JWT_SECRET)`
3. Finds user by decoded `userId` from token
4. Attaches `req.user = user` (without password)
5. Calls `next()` to proceed — or throws 401 if invalid

#### `errorMiddleware.js`
- `notFound`: Catches any route not matched, creates 404 error
- `errorHandler`: Returns JSON `{ message }` with appropriate status code

---

### 5.6 Utils

#### `generateToken.js`
```js
jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })
```
Sets the token as a cookie:
- `httpOnly: true` — JavaScript can't read it (XSS protection)
- `secure: true` in production
- `maxAge: 30 days`

#### `groqGrader.js` — `gradeSubjectiveAnswer(question, modelAnswer, studentAnswer, maxMarks)`
1. Builds a prompt asking Groq LLM to grade fairly
2. Sends to Groq API using `groq.chat.completions.create()`
3. Parses response to extract `score` and `feedback`
4. Returns `{ score, feedback }` — score is between 0 and maxMarks
- Uses LLaMA 3 model via Groq's fast inference API
- Focuses on correctness of concepts, not grammar

#### `emailService.js` — `sendResultEmail(email, name, exam, resultData)`
- Creates Nodemailer transporter with Gmail SMTP
- Sends HTML-formatted email with exam name, score, percentage, feedback
- Also has `sendWelcomeEmail()` for new registrations

#### `cloudinaryUpload.js` — `uploadScreenshot(dataUrl, examId, type)`
- Configures Cloudinary with API key + secret from env
- Uploads base64 image to `proctoring/{examId}/` folder
- Names file as `{type}_{timestamp}`
- Returns `secure_url` of uploaded image

---

## 6. Frontend – Deep Dive

### 6.1 Entry Point

**`index.js`** — Renders `<App />` into `#root` DOM element

**`App.js`** — Root component, wraps everything with providers:
```jsx
<ThemeProvider>        // MUI theme
  <Provider store>     // Redux store
    <CheatingLogProvider>  // Violation context
      <ToastContainer />   // Toast notifications
      <RouterProvider />   // React Router
    </CheatingLogProvider>
  </Provider>
</ThemeProvider>
```

**`axios.js`** — Pre-configured Axios instance
```js
baseURL: process.env.REACT_APP_BACKEND_URL || ''
withCredentials: true  // sends cookies with every request
```

---

### 6.2 Redux Store & Slices

**`store.js`**
- Creates Redux store using `configureStore`
- Registers `authReducer` and `apiSlice.reducer`
- Adds RTK Query middleware for caching

**`authSlice.js`**
- State: `{ userInfo: null }` — loaded from localStorage on app start
- `setCredentials(userInfo)`: saves to state + localStorage
- `logout()`: clears state + localStorage
- This is how the app "remembers" you're logged in after refresh

**`apiSlice.js`** — Base RTK Query config
```js
fetchBaseQuery({
  baseUrl: process.env.REACT_APP_BACKEND_URL,
  credentials: 'include',   // send cookies
  prepareHeaders: ...       // add Authorization header if token exists
})
```

**`usersApiSlice.js`** — Auth API endpoints
- `login(data)` → `POST /api/users/auth`
- `register(data)` → `POST /api/users`
- `logout()` → `POST /api/users/logout`
- `updateUser(data)` → `PUT /api/users/profile`

**`examApiSlice.js`** — Exam API endpoints
- `useGetExamsQuery()` — auto-fetches on component mount
- `useGetQuestionsQuery(examId)` — fetches questions for specific exam
- `useGetUserResultsQuery()` — fetches current user's results
- `useCreateExamMutation()`, `useDeleteExamMutation()` — teacher actions

**`cheatingLogApiSlice.js`**
- `useSaveCheatingLogMutation()` — saves violation log to backend
- `useGetCheatingLogsQuery(examId)` — fetches logs for exam (teacher)

---

### 6.3 Routing

**`Router.js`** — Creates browser router with nested routes:

```
/auth/login          → Login page (no auth required)
/auth/register       → Register page (no auth required)
/auth/404            → Error page

[PrivateRoute]       → Redirects to /auth/login if not logged in
  /                  → Redirects to /dashboard
  /dashboard         → Student dashboard
  /exam              → Exam list page
  /result            → Results page
  /user/profile      → User profile
  /user/account      → Account settings

  [TeacherRoute]     → Redirects to /dashboard if not teacher
    /create-exam     → Create exam form
    /add-questions   → Add questions to exam
    /exam-log        → View cheating logs

[ExamLayout]         → Full-screen exam interface
  /exam/:examId                  → Exam instructions
  /exam/:examId/:testId          → MCQ test page (TestPage)
  /exam/:examId/codedetails      → Coding instructions
  /exam/:examId/code             → Monaco code editor
```

**`PrivateRoute.jsx`**
```jsx
const { userInfo } = useSelector(state => state.auth)
return userInfo ? <Outlet /> : <Navigate to="/auth/login" />
```

**`TeacherRoute.jsx`**
```jsx
return userInfo?.role === 'teacher' ? <Outlet /> : <Navigate to="/dashboard" />
```

---

### 6.4 Context

**`CheatingLogContext.jsx`** — Global violation state shared across WebCam, TestPage

State shape:
```js
{
  noFaceCount: 0,
  multipleFaceCount: 0,
  cellPhoneCount: 0,
  prohibitedObjectCount: 0,
  tabSwitchCount: 0,
  lookingAwayCount: 0,
  totalViolations: 0,       // master counter
  examId: '',
  username: '',
  email: '',
  screenshots: []           // array of {url, type, detectedAt}
}
```

Key functions:
- `updateCheatingLog(fnOrObject)` — accepts function (like setState) or plain object
- `resetCheatingLog(examId)` — resets all counts, sets examId for new exam

Why context and not Redux? This state changes very frequently during an exam (every violation). Context is simpler for this use case.

---

### 6.5 Authentication Views

**`Login.js`**
- Uses Formik for form state, Yup for validation
- On submit: dispatches `useLoginMutation` → on success dispatches `setCredentials()`
- Redirects to `/dashboard` if already logged in (checks `userInfo` from Redux)

**`Register.js`**
- Similar to Login but with more fields (name, role, etc.)
- On success: navigates to `/auth/login`

**`UserProfile.jsx`** / **`UserAccount.jsx`**
- Pre-fills form with current user data
- Submits `updateUserProfile` mutation on save

---

### 6.6 Student Views

#### `Dashboard.jsx`
What it does:
1. Fetches all exams with `useGetExamsQuery()`
2. Fetches user's results with `useGetUserResultsQuery()`
3. Builds `completedExamIds` Set from results
4. Filters `activeExams = exams where examId NOT in completedExamIds`
5. Fetches all results for leaderboard calculation
6. Renders welcome section, performance chart, active exams grid

Key logic:
```js
const completedExamIds = new Set(userResults?.data?.map(r => r.examId))
const activeExams = userExams?.filter(exam => !completedExamIds.has(exam.examId))
```

#### `ExamDetails.jsx` — Pre-exam instructions
- Fetches questions to show count breakdown (MCQ vs subjective)
- Checks for coding questions via API call
- Has checkbox: "I certify I have read all instructions"
- **Start Test button** disabled until checkbox checked
- On click: navigates to `/exam/${examId}/${uniqueId()}` (TestPage)
- Also checks if student already completed exam → redirects to dashboard if yes

#### `TestPage.jsx` — Main exam interface (most complex component)

Responsibilities:
1. **Fullscreen**: enters fullscreen on mount, exits on unmount
2. **Browser lockdown**: disables F12, Ctrl+Shift+I, copy, paste, cut, right-click, select
3. **Tab switch detection**: listens to `visibilitychange`, `blur`, `fullscreenchange` events
4. **Violation watch**: `useEffect` watching `cheatingLog.totalViolations` — triggers termination at 5
5. **Answers ref**: `answersRef` synced by MultipleChoiceQuestion for force-submit
6. **Force submit**: `handleForceSubmit()` submits with current answers when terminated
7. **Normal submit**: `handleTestSubmission()` saves cheating log and navigates to Success

Force submit flow (violation termination):
```js
useEffect(() => {
  if (cheatingLog.totalViolations >= 5 && !terminatedRef.current) {
    terminatedRef.current = true
    swal('Exam Terminated!', ...).then(async () => {
      await axiosInstance.post('/api/users/results', { examId, answers, ... })
      await saveCheatingLogMutation(...)
      navigate('/dashboard')
    })
  }
}, [cheatingLog.totalViolations])
```

#### `MultipleChoiceQuestion.jsx`
- Manages current question index, selected options, subjective text answers
- Tracks MCQ answers in a `Map`, subjective answers in an object
- Syncs answers to `answersRef` (passed from TestPage) on every change
- On last question: saves cheating log + posts result to backend + navigates

#### `ResultPage.jsx`
- Students see: their results table, score, percentage, performance chart
- Teachers see: all students' results, search/filter, export CSV, analytics

---

### 6.7 Teacher Views

**`CreateExamPage.jsx`**
- Form with: exam name, total questions, duration, live date, dead date
- Optional: allowed departments and classes
- Submits `useCreateExamMutation()` → creates exam in DB

**`AddQuestions.jsx`**
- Select exam from dropdown
- Add MCQ question: question text, 4 options, mark one correct, assign marks
- Add subjective question: question text, model answer, marks
- Add coding question: question, description

**`ExamLogPage.jsx`**
- Dropdown to select exam
- Fetches cheating logs for selected exam
- Shows table: student name, email, violation counts, screenshots (as thumbnails)

---

### 6.8 WebCam Component (Proctoring)

This is the most technically complex component. File: `frontend/src/views/student/Components/WebCam.jsx`

**Libraries used:**
- `@tensorflow/tfjs` — loads TensorFlow runtime in browser
- `@tensorflow-models/coco-ssd` — COCO object detection model
- `@mediapipe/face_mesh` — Google's face landmark detection
- `react-webcam` — webcam access wrapper

**Constants:**
```js
const COOLDOWN_MS = 8000        // 8 seconds between violations of same type
const AWAY_FRAME_THRESHOLD = 20 // frames looking away before triggering
```

**Refs used (not state — avoids re-renders):**
- `webcamRef` — access to video element
- `canvasRef` — draw detection boxes
- `faceMeshRef` — MediaPipe instance
- `isProcessingRef` — prevents concurrent FaceMesh calls
- `smoothPoseRef` — exponential smoothing for head pose values
- `awayFramesRef` — frame counter for looking away
- `cooldownMapRef` — `{ violationType: lastTimestamp }` per type
- `totalViolationsRef` — always has latest count (avoids stale closure)
- `onTerminateRef` — always has latest onTerminate callback

**Head Pose Detection:**
FaceMesh gives 468 face landmarks. We use specific points:
- Point 1 = nose tip
- Point 234 = left cheek
- Point 454 = right cheek
- Point 10 = forehead top
- Point 152 = chin bottom

```js
yawRatio = |nose.x - left.x| / |right.x - nose.x|
// yaw ~1.0 = looking straight, <0.45 = turned left, >1.55 = turned right

pitchRatio = |nose.y - top.y| / |bottom.y - nose.y|
// pitch ~1.0 = straight, <0.45 = looking up, >1.75 = looking down
```

Exponential smoothing with alpha=0.85 reduces jitter:
```js
smoothed = 0.85 * previous + 0.15 * current
```

**COCO-SSD Detection:**
- Runs every 1000ms (1 second) using `setInterval`
- Only triggers violations for detections with `score > 0.6` (60% confidence)
- Detected classes that trigger violations: `'cell phone'`, `'book'`, `'laptop'`

**`handleViolation(type, label)`:**
1. Check cooldown — skip if same type triggered within 8 seconds
2. Increment `totalViolationsRef.current`
3. Upload screenshot to backend → Cloudinary
4. Call `updateCheatingLog()` with new count and screenshot
5. If < 5: show `swal` warning with count `"Violation X/5"`
6. If >= 5: TestPage's `useEffect` handles termination (watches `totalViolations`)

**Screenshot upload:**
```js
POST /api/upload/screenshot
Body: { dataUrl (base64 jpeg), examId, type }
```
Goes to backend → `cloudinaryUpload.js` → Cloudinary CDN → returns `secure_url`

**Violation overlay on webcam:**
Shows "Violations: X/5" badge — turns red when X >= 4

---

## 7. Complete Data Flows

### 7.1 Login Flow
```
User types email + password
  → Formik submits form
  → useLoginMutation() fires
  → RTK Query: POST /api/users/auth
  → authMiddleware NOT applied (public route)
  → authController.authUser():
      1. User.findOne({ email })
      2. user.matchPassword(password) → bcrypt.compare()
      3. generateToken(res, user._id) → sets JWT cookie
      4. Returns { _id, name, email, role, ... }
  → Frontend: dispatch(setCredentials(userInfo))
  → authSlice saves to Redux state + localStorage
  → Navigate to /dashboard
```

### 7.2 Exam Attempt Flow
```
Student sees dashboard
  → useGetExamsQuery() fetches GET /api/users/exam
  → Backend filters by student department/class + live dates
  → Active exams shown as cards

Click exam card → /exam/:examId (ExamDetails)
  → Check if already completed (useGetUserResultsQuery)
  → If completed → redirect to dashboard
  → Show instructions, check certification checkbox
  → Click Start Test → navigate to /exam/:examId/:testId (TestPage)

TestPage mounts:
  → Enter fullscreen
  → Register keyboard/mouse lockdown events
  → Start WebCam (loads COCO-SSD + FaceMesh)
  → Start timer
  → Load questions via useGetQuestionsQuery(examId)

Student answers questions
  → Each answer stored in answers Map
  → answersRef synced on each change

Click Submit (or timer runs out):
  → axiosInstance.post('/api/users/results', { examId, answers, subjectiveAnswers })
  → Backend: saveResult() grades all answers
  → saveCheatingLogMutation() saves violation log
  → Navigate to /Success
```

### 7.3 Proctoring Flow
```
WebCam component mounted in TestPage

Every 1 second:
  COCO-SSD detects objects in video frame
    → If cell phone/book/laptop (confidence > 0.6):
        → handleViolation('cellPhone', 'Cell phone detected')

  FaceMesh processes video frame:
    → If 0 faces: handleViolation('noFace', 'No face detected')
    → If 2+ faces: handleViolation('multipleFace', 'Multiple faces detected')
    → If 1 face: calculate head pose
        → If looking away for 20+ consecutive frames:
            → handleViolation('lookingAway', 'Please look at screen')

Tab/window events in TestPage:
  → visibilitychange (tab hidden): increment totalViolations
  → window blur (Alt+Tab, Win key): increment totalViolations
  → fullscreenchange (exit fullscreen): increment totalViolations

handleViolation():
  → Check 8s cooldown per type
  → Increment totalViolationsRef
  → Capture screenshot from webcam canvas
  → POST /api/upload/screenshot → Cloudinary
  → updateCheatingLog() with new count + screenshot URL
  → Show swal warning "Violation X/5"
```

### 7.4 Grading Flow
```
saveResult() in resultController.js:

1. MCQ Grading:
   for each MCQ question:
     correctOption = question.options.find(opt => opt.isCorrect)
     if answers[question._id] === correctOption._id:
       mcqScore += question.ansmarks

2. Subjective Grading (via Groq AI):
   for each subjective question:
     groqGrader.gradeSubjectiveAnswer(
       question.question,
       question.modelAnswer,
       studentAnswer,
       question.ansmarks
     )
     → Sends prompt to Groq LLaMA API
     → Returns { score: number, feedback: string }
     → subjectiveScore += score
     → Saves SubjectiveResponse document

3. Final calculation:
   totalScore = mcqScore + subjectiveScore
   percentage = (totalScore / maxPossible) * 100
   capped at 100%

4. Result saved to DB
5. Email sent to student
```

### 7.5 Violation Termination Flow
```
cheatingLog.totalViolations reaches 5

TestPage useEffect detects change:
  → terminatedRef.current = true (prevents double trigger)
  → swal('Exam Terminated!', ...).then(async () => {

      answers = answersRef.current (whatever was answered so far)
      if no answers: use { terminated: 'terminated' }

      POST /api/users/results { examId, answers, subjectiveAnswers: {} }
      → Backend saves result (even with partial/empty answers)
      → This blocks re-attempt (existingResult check)

      saveCheatingLogMutation(cheatingLog)
      → Saves all violations + screenshot URLs

      navigate('/dashboard')
  })

Back at dashboard:
  → useGetUserResultsQuery() shows result exists
  → completedExamIds now includes this examId
  → Exam no longer shown as active → cannot re-attempt
```

---

## 8. Security Features

| Feature | Implementation |
|---|---|
| Password hashing | bcryptjs, 10 salt rounds, pre-save hook in userModel |
| JWT auth | 30-day token, httpOnly cookie (JS cannot read), verified on every protected route |
| Protected routes | `protect` middleware reads + verifies JWT, attaches `req.user` |
| Role-based access | `TeacherRoute` component on frontend, role check in teacher-only controllers |
| Duplicate submission prevention | `Result.findOne({ examId, userId })` check before saving |
| Browser lockdown | Disables F12, Ctrl+Shift+I/J/C, Ctrl+U, copy, paste, cut, right-click, select |
| Fullscreen enforcement | `document.requestFullscreen()` on exam start, exits trigger violation |
| Tab switch detection | `visibilitychange` event, `window blur` event |
| CORS restriction | Only allows specific Vercel URLs + localhost |
| Exam access control | `allowedDepartments` + `allowedClasses` filters on getExams |
| Date-based access | `liveDate <= now <= deadDate` filter for students |
| Screenshot evidence | Cloudinary upload with exam/violation metadata |

---

## 9. API Endpoints Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/users | No | Register |
| POST | /api/users/auth | No | Login |
| POST | /api/users/logout | No | Logout |
| GET | /api/users/profile | Yes | Get profile |
| PUT | /api/users/profile | Yes | Update profile |
| GET | /api/users/exam | Yes | Get exams |
| POST | /api/users/exam | Yes (teacher) | Create exam |
| DELETE | /api/users/exam/:examId | Yes (teacher) | Delete exam |
| GET | /api/users/exam/questions/:examId | Yes | Get questions |
| POST | /api/users/exam/questions | Yes (teacher) | Add question |
| POST | /api/users/results | Yes | Submit result |
| GET | /api/users/results/user | Yes | My results |
| GET | /api/users/results/all | Yes (teacher) | All results |
| GET | /api/users/results/exam/:examId | Yes (teacher) | Exam results |
| PUT | /api/users/results/:id/toggle-visibility | Yes (teacher) | Show/hide result |
| POST | /api/users/cheatingLogs | Yes | Save violations |
| GET | /api/users/cheatingLogs/:examId | Yes (teacher) | Get violations |
| POST | /api/coding/submit | Yes | Submit code |
| POST | /api/coding/question | Yes (teacher) | Add coding question |
| GET | /api/coding/questions/:examId | Yes | Get coding questions |
| POST | /api/upload/screenshot | Yes | Upload screenshot |
| POST | /run-python | No | Run Python code |
| POST | /run-javascript | No | Run JS code |
| POST | /run-java | No | Run Java code |

---

## 10. Key Concepts to Understand

### Why `useRef` instead of `useState` in WebCam?
`useState` causes re-renders which would reset TensorFlow models and FaceMesh. `useRef` holds mutable values without triggering re-renders. This is critical for performance in the detection loop.

### Why is `examId` a UUID string, not a MongoDB ObjectId?
UUID allows the same `examId` to link across multiple collections (Questions, Results, CheatingLogs) without MongoDB population. It's easier to pass around as a URL param and query string.

### Why does COCO-SSD run in the browser?
TensorFlow.js runs the model entirely on the student's device using WebGL. This means:
- Zero server load — 1000 students = 1000 devices running detection locally
- No video data sent to server (privacy)
- Scales infinitely without backend changes

### What is the stale closure problem we solved?
In React, `useCallback` captures variables at the time of creation. If `onTerminate` changes (because `handleForceSubmit` re-creates), the old callback is used. Solution: `useRef` always points to the latest function, no stale capture.

### How does RTK Query work?
RTK Query is like a smart Axios that auto-caches, deduplicates requests, and provides loading/error states. `useGetExamsQuery()` automatically fires `GET /api/users/exam` when the component mounts and caches the result. No manual `useEffect` + `axios.get` needed.

### How is the exam re-attempt blocked?
Two layers:
1. **Frontend**: `completedExamIds` Set excludes finished exams from active list. `ExamDetails` checks `getUserResults` and redirects if already completed.
2. **Backend**: `saveResult()` does `Result.findOne({ examId, userId })` — throws 400 if result exists.

### What happens if the student's internet drops mid-exam?
Currently the exam state is only in browser memory. If they refresh, they lose progress. This is a known limitation — a production improvement would be auto-saving answers every 30 seconds to a draft endpoint.
