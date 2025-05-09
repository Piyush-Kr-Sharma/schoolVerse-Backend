const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Teacher = require("../models/teacherSchema.js");
const Subject = require("../models/subjectSchema.js");
const Student = require("../models/studentSchema.js");
const Assignment = require("../models/assignmentSchema.js");

const teacherRegister = async (req, res) => {
  const {
    name,
    email,
    password,
    appSpecPassword,
    role,
    school,
    teachSubject,
    teachSclass,
  } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const teacher = new Teacher({
      name,
      email,
      password: hashedPass,
      appSpecPassword,
      role,
      school,
      teachSubject,
      teachSclass,
    });

    const existingTeacherByEmail = await Teacher.findOne({ email });

    if (existingTeacherByEmail) {
      res.send({ message: "Email already exists" });
    } else {
      let result = await teacher.save();
      await Subject.findByIdAndUpdate(teachSubject, { teacher: teacher._id }); // teachSubject is the id of the subject to which the teacher is assigned and it finds that subject with that id and update the teacher field of that subject to the newly made teacher's id
      result.password = undefined;
      result.appSpecPassword = undefined;
      res.send(result);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const teacherLogIn = async (req, res) => {
  try {
    let teacher = await Teacher.findOne({ email: req.body.email });
    if (teacher) {
      const validated = await bcrypt.compare(
        req.body.password,
        teacher.password
      );
      if (validated) {
        teacher = await teacher.populate("teachSubject", "subName sessions");
        teacher = await teacher.populate("school", "schoolName");
        teacher = await teacher.populate("teachSclass", "sclassName");
        teacher.password = undefined;
        res.send(teacher);
      } else {
        res.send({ message: "Invalid password" });
      }
    } else {
      res.send({ message: "Teacher not found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getTeachers = async (req, res) => {
  try {
    let teachers = await Teacher.find({ school: req.params.id })
      .populate("teachSubject", "subName")
      .populate("teachSclass", "sclassName");
    if (teachers.length > 0) {
      let modifiedTeachers = teachers.map((teacher) => {
        return { ...teacher._doc, password: undefined };
      });
      res.send(modifiedTeachers);
    } else {
      res.send({ message: "No teachers found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getTeacherDetail = async (req, res) => {
  try {
    let teacher = await Teacher.findById(req.params.id)
      .populate("teachSubject", "subName sessions")
      .populate("school", "schoolName")
      .populate("teachSclass", "sclassName");
    if (teacher) {
      teacher.password = undefined;
      res.send(teacher);
    } else {
      res.send({ message: "No teacher found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateTeacherSubject = async (req, res) => {
  const { teacherId, teachSubject } = req.body;
  try {
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { teachSubject },
      { new: true }
    );

    await Subject.findByIdAndUpdate(teachSubject, {
      teacher: updatedTeacher._id,
    });

    res.send(updatedTeacher);
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);

    await Subject.updateOne(
      { teacher: deletedTeacher._id, teacher: { $exists: true } },
      { $unset: { teacher: 1 } }
    );

    res.send(deletedTeacher);
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteTeachers = async (req, res) => {
  try {
    const deletionResult = await Teacher.deleteMany({ school: req.params.id });

    const deletedCount = deletionResult.deletedCount || 0;

    if (deletedCount === 0) {
      res.send({ message: "No teachers found to delete" });
      return;
    }

    const deletedTeachers = await Teacher.find({ school: req.params.id });

    await Subject.updateMany(
      {
        teacher: { $in: deletedTeachers.map((teacher) => teacher._id) },
        teacher: { $exists: true },
      },
      { $unset: { teacher: "" }, $unset: { teacher: null } }
    );

    res.send(deletionResult);
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteTeachersByClass = async (req, res) => {
  try {
    const deletionResult = await Teacher.deleteMany({
      sclassName: req.params.id,
    });

    const deletedCount = deletionResult.deletedCount || 0;

    if (deletedCount === 0) {
      res.send({ message: "No teachers found to delete" });
      return;
    }

    const deletedTeachers = await Teacher.find({ sclassName: req.params.id });

    await Subject.updateMany(
      {
        teacher: { $in: deletedTeachers.map((teacher) => teacher._id) },
        teacher: { $exists: true },
      },
      { $unset: { teacher: "" }, $unset: { teacher: null } }
    );

    res.send(deletionResult);
  } catch (error) {
    res.status(500).json(error);
  }
};

const teacherAttendance = async (req, res) => {
  const { status, date } = req.body;

  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.send({ message: "Teacher not found" });
    }

    const existingAttendance = teacher.attendance.find(
      (a) => a.date.toDateString() === new Date(date).toDateString()
    );

    if (existingAttendance) {
      existingAttendance.status = status;
    } else {
      teacher.attendance.push({ date, status });
    }

    const result = await teacher.save();
    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const teacherPostAssignment = async (req, res) => {
  const { deadline, description, fileURL, subjectId, classId } = req.body;

  try {
    const existingAssignment = await Assignment.findOne({
      deadline,
      description,
      fileURL,
      subjectId,
      classId,
    });

    if (existingAssignment) {
      return res.status(400).json({
        message: "An assignment with the same details already exists.",
      });
    }

    // Create a new assignment
    const newAssignment = new Assignment({
      deadline,
      description,
      fileURL,
      subjectId,
      classId,
    });

    await newAssignment.save();

    res.status(201).json({
      message: "Assignment posted successfully!",
      assignment: newAssignment,
    });
  } catch (error) {
    console.error("Error adding assignment:", error);
    res.status(500).json({
      message: "An error occurred while adding the assignment.",
      error: error.message,
    });
  }
};

const teacherUploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }
  // Construct the file URL
  const fileURL = `${process.env.BASE_URL}/Teacher/uploadFile/${req.file.filename}`;
  res.status(200).json({ fileURL, message: "File uploaded successfully." });
};

const getAssignmentPostedByTeacher = async (req, res) => {
  const { classId, subjectId } = req.params;

  if (!classId || !subjectId) {
    return res
      .status(400)
      .json({ message: "classId and subjectId are required." });
  }

  try {
    const assignments = await Assignment.find({ classId, subjectId }).sort({
      createdAt: -1,
    }); // Sort by most recent
    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Error fetching assignments." });
  }
};

const getSubmissionsOfAssignment = async (req, res) => {
  const { assignmentId } = req.params; // Expecting assignmentId as a route parameter

  if (!assignmentId) {
    return res.status(400).json({ message: "assignmentId is required." });
  }

  try {
    const assignment = await Assignment.findById(assignmentId).populate(
      "submissions.studentId", // Populate studentId if it's a reference
      "name rollNo" // Only include name and rollNo fields
    );

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    // Return the submissions array
    res.status(200).json(assignment.submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions." });
  }
};

const teacherSentComplain = async (req, res) => {
  const { subject, description, studentId, teacherId } = req.body;

  try {
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const parentEmail = student.parentEmail;

    if (!parentEmail) {
      return res
        .status(400)
        .json({ message: "Parent email not found for the student." });
    }

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    const teacherEmail = teacher.email;
    const teacherPassword = teacher.appSpecPassword;

    if (!teacherEmail || !teacherPassword) {
      return res.status(400).json({
        message: "Teacher's email credentials are not available.",
      });
    }

    // Create a transporter for sending the email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: teacherEmail,
        pass: teacherPassword,
      },
    });

    // Email content
    const mailOptions = {
      from: teacherEmail, // Email sent from the teacher's email
      to: parentEmail, // Parent's email
      subject: `Complaint Regarding ${student.name}: ${subject}`,
      text: `Dear Parent,\n\nA complaint has been raised regarding your child, ${student.name}:\n\nSubject: ${subject}\n\nDescription: ${description}\n\nPlease address this matter promptly.\n\nRegards,\n${teacher.name}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Complaint email sent successfully." });
  } catch (error) {
    console.error("Error sending complaint email:", error);
    res.status(500).json({ message: "Failed to send complaint email." });
  }
};

module.exports = {
  teacherRegister,
  teacherLogIn,
  getTeachers,
  getTeacherDetail,
  updateTeacherSubject,
  deleteTeacher,
  deleteTeachers,
  deleteTeachersByClass,
  teacherAttendance,
  teacherPostAssignment,
  teacherUploadFile,
  teacherSentComplain,
  getAssignmentPostedByTeacher,
  getSubmissionsOfAssignment,
};
