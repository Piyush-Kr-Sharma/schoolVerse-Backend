const router = require("express").Router();
const upload = require("../middleware/TeacherMulter.js");

const {
  adminRegister,
  adminLogIn,
  getAdminDetail,
  adminFeeCollection,
} = require("../controllers/admin-controller.js");
const {
  checkAndMarkAttendance,
  getAttendanceByDate,
  getAttendancePercentage,
} = require("../controllers/attendance-controller.js");

const {
  sclassCreate,
  sclassList,
  deleteSclass,
  deleteSclasses,
  getSclassDetail,
  getSclassStudents,
} = require("../controllers/class-controller.js");
const {
  complainCreate,
  complainList,
} = require("../controllers/complain-controller.js");
const {
  noticeCreate,
  noticeList,
  deleteNotices,
  deleteNotice,
  updateNotice,
} = require("../controllers/notice-controller.js");
const {
  studentRegister,
  studentLogIn,
  getStudents,
  getStudentDetail,
  deleteStudents,
  deleteStudent,
  updateStudent,
  studentAttendance,
  deleteStudentsByClass,
  updateExamResult,
  clearAllStudentsAttendanceBySubject,
  clearAllStudentsAttendance,
  removeStudentAttendanceBySubject,
  removeStudentAttendance,
  getStudentAssignments,
  getAllAssignments,
  getFeeDetails,
  payfee,
  createOrder,
  studentSubmitAssignment,
  studentUploadFile,
} = require("../controllers/student_controller.js");

const {
  subjectCreate,
  deleteSubjectsByClass,
  getSubjectDetail,
  deleteSubject,
  freeSubjectList,
  allSubjects,
  deleteSubjects,
  classSubjects,
} = require("../controllers/subject-controller.js");
const {
  teacherRegister,
  teacherLogIn,
  getTeachers,
  getTeacherDetail,
  deleteTeachers,
  deleteTeachersByClass,
  deleteTeacher,
  updateTeacherSubject,
  teacherAttendance,
  teacherPostAssignment,
  teacherUploadFile,
  teacherSentComplain,
  getAssignmentPostedByTeacher,
  getSubmissionsOfAssignment,
} = require("../controllers/teacher-controller.js");
const uploadTeacher = require("../middleware/TeacherMulter.js");
const uploadStudent = require("../middleware/StudentMulter.js");
// const upload = require("../middleware/multer.js");

// Admin
router.post("/AdminReg", adminRegister);
router.post("/AdminLogin", adminLogIn);

router.get("/Admin/:id", getAdminDetail);
router.get("/Admin/feeCollection/:adminId", adminFeeCollection);
// router.delete("/Admin/:id", deleteAdmin)

// router.put("/Admin/:id", updateAdmin)

// Student

router.post("/StudentReg", studentRegister);
router.post("/StudentLogin", studentLogIn);

router.post("/Student/submitAssignment", studentSubmitAssignment);
router.post(
  "/Student/uploadFile",
  uploadStudent.single("submitAssignmentFile"),
  studentUploadFile
);

router.get("/Students/:id", getStudents);
router.get("/Student/:id", getStudentDetail);
router.get("/Student/getallassignment/:id", getAllAssignments);
router.get("/Student/assignments/:id/:subjectId", getStudentAssignments);
router.get("/Student/fees/:id", getFeeDetails);
router.post("/Student/fees/pay", payfee);
router.post("/Student/fees/create-order", createOrder);

router.delete("/Students/:id", deleteStudents);
router.delete("/StudentsClass/:id", deleteStudentsByClass);
router.delete("/Student/:id", deleteStudent);

router.put("/Student/:id", updateStudent);

router.put("/UpdateExamResult/:id", updateExamResult);

router.put("/StudentAttendance/:id", studentAttendance);

router.put(
  "/RemoveAllStudentsSubAtten/:id",
  clearAllStudentsAttendanceBySubject
);
router.put("/RemoveAllStudentsAtten/:id", clearAllStudentsAttendance);

router.put("/RemoveStudentSubAtten/:id", removeStudentAttendanceBySubject);
router.put("/RemoveStudentAtten/:id", removeStudentAttendance);

// Students Attendance
router.post("/StudentsAttendance", checkAndMarkAttendance);
router.get("/attendance/:classId/:subjectId/:date", getAttendanceByDate);
router.get("/percentage/:studentId/:subjectId", getAttendancePercentage);

// Teacher

router.post("/TeacherReg", teacherRegister);
router.post("/TeacherLogin", teacherLogIn);
router.post("/Teacher/SendMail", teacherSentComplain);
router.post("/Teacher/assignment", teacherPostAssignment);
router.post(
  "/Teacher/uploadFile",
  uploadTeacher.single("assignmentFile"),
  teacherUploadFile
);

router.get("/Teachers/:id", getTeachers);
router.get("/Teacher/:id", getTeacherDetail);
router.get(
  "/Teacher/getAssignments/:classId/:subjectId",
  getAssignmentPostedByTeacher
);
router.get("/Teacher/getSubmissions/:assignmentId", getSubmissionsOfAssignment);

router.delete("/Teachers/:id", deleteTeachers);
router.delete("/TeachersClass/:id", deleteTeachersByClass);
router.delete("/Teacher/:id", deleteTeacher);

router.put("/TeacherSubject", updateTeacherSubject);

router.post("/TeacherAttendance/:id", teacherAttendance);

// Notice

router.post("/NoticeCreate", noticeCreate);

router.get("/NoticeList/:id", noticeList);

router.delete("/Notices/:id", deleteNotices);
router.delete("/Notice/:id", deleteNotice);

router.put("/Notice/:id", updateNotice);

// Complain

router.post("/ComplainCreate", complainCreate);

router.get("/ComplainList/:id", complainList);

// Sclass

router.post("/SclassCreate", sclassCreate);

router.get("/SclassList/:id", sclassList);
router.get("/Sclass/:id", getSclassDetail);

router.get("/Sclass/Students/:id", getSclassStudents);

router.delete("/Sclasses/:id", deleteSclasses);
router.delete("/Sclass/:id", deleteSclass);

// Subject

router.post("/SubjectCreate", subjectCreate);

router.get("/AllSubjects/:id", allSubjects);
router.get("/ClassSubjects/:id", classSubjects);
router.get("/FreeSubjectList/:id", freeSubjectList);
router.get("/Subject/:id", getSubjectDetail);

router.delete("/Subject/:id", deleteSubject);
router.delete("/Subjects/:id", deleteSubjects);
router.delete("/SubjectsClass/:id", deleteSubjectsByClass);

module.exports = router;
