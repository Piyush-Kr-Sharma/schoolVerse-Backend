require("dotenv").config();
const bcrypt = require("bcrypt");
const Student = require("../models/studentSchema.js");
const Subject = require("../models/subjectSchema.js");
const Assignment = require("../models/assignmentSchema.js");

const studentRegister = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);

    const existingStudent = await Student.findOne({
      // search a student which have all the  specified fields same as the req.body
      rollNum: req.body.rollNum,
      school: req.body.adminID,
      sclassName: req.body.sclassName,
    });

    if (existingStudent) {
      res.send({ message: "Roll Number already exists" });
    } else {
      const student = new Student({
        ...req.body,
        school: req.body.adminID,
        password: hashedPass,
      });

      let result = await student.save();

      result.password = undefined;
      res.send(result);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const studentLogIn = async (req, res) => {
  try {
    let student = await Student.findOne({
      rollNum: req.body.rollNum,
      name: req.body.studentName,
    });
    if (student) {
      const validated = await bcrypt.compare(
        req.body.password,
        student.password
      );
      if (validated) {
        // Fetching additional details (e.g., school name and class name) using populate
        student = await student.populate("school", "schoolName"); // Only the schoolName field from the admin collection is fetched.
        student = await student.populate("sclassName", "sclassName");

        // Below fields are sensitive or unnecessary for the response, so they are set to undefined.
        // When the student object is converted to JSON for the response, these fields will be excluded
        student.password = undefined;
        student.examResult = undefined;
        student.attendance = undefined;
        res.send(student);
      } else {
        res.send({ message: "Invalid password" });
      }
    } else {
      res.send({ message: "Student not found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getStudents = async (req, res) => {
  try {
    let students = await Student.find({ school: req.params.id }).populate(
      "sclassName"
    );
    if (students.length > 0) {
      let modifiedStudents = students.map((student) => {
        return { ...student._doc, password: undefined };
      });
      res.send(modifiedStudents);
    } else {
      res.send({ message: "No students found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getStudentDetail = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id)
      .populate("school", "schoolName")
      .populate("sclassName", "sclassName")
      .populate("examResult.subName", "subName")
      .populate("attendance.subName", "subName sessions");
    if (student) {
      student.password = undefined;
      res.send(student);
    } else {
      res.send({ message: "No student found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getStudentAssignments = async (req, res) => {
  const { id, subjectId } = req.params;
  try {
    // Fetch the specific student with their assignments
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const classId = student.sclassName;
    const assignments = await Assignment.find({
      classId,
      subjectId,
    }).select("deadline description fileURL");

    if (assignments.length === 0) {
      return res
        .status(404)
        .json({ message: "No assignments found for this subject." });
    }

    // Return the assignments
    res.status(200).json({ assignments });
  } catch (error) {
    console.error("Error retrieving assignments:", error);
    res.status(500).json({
      message: "An error occurred while fetching assignments.",
      error,
    });
  }
};

const studentUploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }
  // Construct the file URL
  const file = `${process.env.BASE_URL}/Student/uploadFile/${req.file.filename}`;
  res.status(200).json({ file, message: "File uploaded successfully." });
};

const studentSubmitAssignment = async (req, res) => {
  const { assignmentId, studentId, file, rollNum, name } = req.body;

  try {
    // Find the assignment by its ID
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found.",
      });
    }

    // Check if the student has already submitted
    const existingSubmission = assignment.submissions.find(
      (submission) => String(submission.studentId) === String(studentId)
    );

    if (existingSubmission) {
      return res.status(400).json({
        message: "You have already submitted this assignment.",
      });
    }

    // Add the student's submission to the submissions array
    const newSubmission = {
      ...req.body,
      studentId,
      file,
      submittedAt: new Date(),
    };

    assignment.submissions.push(newSubmission);

    // Save the updated assignment
    await assignment.save();

    res.status(200).json({
      message: "Assignment submitted successfully!",
      submission: newSubmission,
    });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    res.status(500).json({
      message: "An error occurred while submitting the assignment.",
      error: error.message,
    });
  }
};

const getAllAssignments = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const classId = student.sclassName;
    if (!classId) {
      return res.status(404).json({ message: "Class not found." });
    }

    // Fetch all assignments for the class
    const assignments = await Assignment.find({ classId }).select(
      "deadline description fileURL"
    );

    return res.status(200).json({
      message: "All Assignments fetched successfully",
      assignments,
      totalAssignments: assignments.length, // Ensuring a valid length count
    });
  } catch (error) {
    console.error("Error retrieving assignments:", error);
    res.status(500).json({
      message: "An error occurred while fetching assignments.",
      error,
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const result = await Student.findByIdAndDelete(req.params.id);
    res.send(result);
  } catch (error) {
    res.status(500).json(err);
  }
};

const deleteStudents = async (req, res) => {
  try {
    const result = await Student.deleteMany({ school: req.params.id });
    if (result.deletedCount === 0) {
      res.send({ message: "No students found to delete" });
    } else {
      res.send(result);
    }
  } catch (error) {
    res.status(500).json(err);
  }
};

const deleteStudentsByClass = async (req, res) => {
  try {
    const result = await Student.deleteMany({ sclassName: req.params.id });
    if (result.deletedCount === 0) {
      res.send({ message: "No students found to delete" });
    } else {
      res.send(result);
    }
  } catch (error) {
    res.status(500).json(err);
  }
};

const updateStudent = async (req, res) => {
  try {
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }
    console.log("req.body: ", req.body);
    let result = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    result.password = undefined;
    res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateExamResult = async (req, res) => {
  const { subName, marksObtained } = req.body;

  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.send({ message: "Student not found" });
    }

    // Checks if the student already has a result for the given subject.
    const existingResult = student.examResult.find(
      (result) => result.subName.toString() === subName //  // Searches the examResult array for an object with a subName matching the one provided in the request
    );

    if (existingResult) {
      existingResult.marksObtained = marksObtained;
    } else {
      student.examResult.push({ subName, marksObtained });
    }

    const result = await student.save();
    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const studentAttendance = async (req, res) => {
  const { subName, status, date } = req.body;

  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.send({ message: "Student not found" });
    }

    const subject = await Subject.findById(subName);

    const existingAttendance = student.attendance.find(
      (a) =>
        a.date.toDateString() === new Date(date).toDateString() &&
        a.subName.toString() === subName
    );

    if (existingAttendance) {
      existingAttendance.status = status;
    } else {
      // Check if the student has already attended the maximum number of sessions
      const attendedSessions = student.attendance.filter(
        (a) => a.subName.toString() === subName
      ).length;

      if (attendedSessions >= subject.sessions) {
        return res.send({ message: "Maximum attendance limit reached" });
      }

      student.attendance.push({ date, status, subName });
    }

    const result = await student.save();
    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const clearAllStudentsAttendanceBySubject = async (req, res) => {
  const subName = req.params.id;

  try {
    const result = await Student.updateMany(
      { "attendance.subName": subName }, // search for the students whose attendence array contains the attendence of that particular subject
      { $pull: { attendance: { subName } } } // $pull operator removes all elements from the attendance array where the subName matches the given value.
    );
    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const clearAllStudentsAttendance = async (req, res) => {
  const schoolId = req.params.id;

  try {
    const result = await Student.updateMany(
      { school: schoolId }, // search for the students with school as schoolId means all the students of that school
      { $set: { attendance: [] } } // set all those student's attendence array as empty
    );

    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const removeStudentAttendanceBySubject = async (req, res) => {
  const studentId = req.params.id;
  const subName = req.body.subId;

  try {
    const result = await Student.updateOne(
      { _id: studentId },
      { $pull: { attendance: { subName: subName } } }
    );

    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const removeStudentAttendance = async (req, res) => {
  const studentId = req.params.id;

  try {
    const result = await Student.updateOne(
      { _id: studentId },
      { $set: { attendance: [] } }
    );

    return res.send(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getFeeDetails = async (req, res) => {
  const studentId = req.params.id;
  try {
    const student = await Student.findById(studentId).select(
      "fees name rollNum"
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.fees || student.fees.length === 0) {
      const currentYear = new Date().getFullYear();
      const defaultFees = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ].map((month) => ({
        month,
        year: currentYear,
        amount: 1000, // Default fee amount
        isPaid: false,
      }));

      student.fees = defaultFees;

      await student.save();
    }

    res.json({
      student: student.name,
      rollNum: student.rollNum,
      fees: student.fees,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const Razorpay = require("razorpay");
const crypto = require("crypto");
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

// Create Razorpay Order (To be called from the frontend)
const createOrder = async (req, res) => {
  const { studentId, month, amount } = req.body;

  try {
    // Find student and validate
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const feeIndex = student.fees.findIndex((fee) => fee.month === month);
    if (feeIndex === -1) {
      return res
        .status(404)
        .json({ message: "Fee record not found for the specified month" });
    }

    if (student.fees[feeIndex].isPaid) {
      return res.status(400).json({ message: "Fee is already paid" });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Amount in paise (₹1 = 100 paise)
      currency: "INR",
      receipt: `order-${studentId}-${month}`,
    };

    const order = await razorpayInstance.orders.create(options);
    // console.log(order);

    res.status(200).json({
      message: "Order created successfully",
      orderId: order.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating order", error });
  }
};

const payfee = async (req, res) => {
  const { studentId, month, paymentId, orderId, signature } = req.body;

  try {
    // Step 1: Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const feeIndex = student.fees.findIndex((fee) => fee.month === month);
    if (feeIndex === -1) {
      return res
        .status(404)
        .json({ message: "Fee record not found for the specified month" });
    }

    if (student.fees[feeIndex].isPaid) {
      return res.status(400).json({ message: "Fee is already paid" });
    }

    // Step 2: Verify Razorpay payment
    // console.log("RAZORPAY_KEY_SECRET: ", process.env.RAZORPAY_SECRET_KEY);
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Step 3: Mark the fee as paid
    student.fees[feeIndex].isPaid = true;
    student.fees[feeIndex].paidDate = new Date();
    await student.save();

    res.status(200).json({
      message: "Fee payment successful",
      fee: student.fees[feeIndex],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing payment", error });
  }
};

module.exports = {
  studentRegister,
  studentLogIn,
  getStudents,
  getStudentDetail,
  getAllAssignments,
  getStudentAssignments,
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
  getFeeDetails,
  payfee,
  createOrder,
  studentUploadFile,
  studentSubmitAssignment,
};
