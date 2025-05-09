const Attendance = require("../models/attendanceSchema");
const Student = require("../models/studentSchema");
const Subject = require("../models/subjectSchema");

const checkAndMarkAttendance = async (req, res) => {
  try {
    const { classId, subjectId, date, attendanceRecords } = req.body;
    // Normalize date to prevent time discrepancies
    const formattedDate = new Date(date).toISOString().split("T")[0];

    const existingAttendance = await Attendance.findOne({
      classId,
      subjectId,
      date: formattedDate,
    })
      .populate("records.studentId", "name rollNum") // studentId will refer to the student model and from that we can access any of the fields of student
      .lean();

    if (existingAttendance) {
      return res.status(200).json({
        message: "Attendance already taken for this date",
        // attendance: existingAttendance,
      });
    }

    // If no attendance exists, create a new record with provided attendanceRecords
    if (attendanceRecords && attendanceRecords.length > 0) {
      const newAttendance = new Attendance({
        classId,
        subjectId,
        date: formattedDate,
        records: attendanceRecords, // Array of {studentId, status}
      });

      await newAttendance.save();

      // Now we update the attendance feild of each student
      for (const record of attendanceRecords) {
        const { studentId, status } = record; // take out the attendance record for each student one by one
        await Student.findByIdAndUpdate(
          studentId,
          {
            $push: {
              attendance: {
                date: formattedDate,
                status,
                subName: subjectId,
              },
            },
          },
          { new: true }
        );
      }

      return res.status(200).json({
        message: "Attendance marked successfully",
        attendance: newAttendance,
      });
    }
    // If no attendanceRecords provided
    return res.status(400).json({ message: "No attendance records provided." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error processing attendance", error: error.message });
  }
};

// fetch date-wise attendance for a class and subject
const getAttendanceByDate = async (req, res) => {
  try {
    const { classId, subjectId, date } = req.params;

    const formattedDate = new Date(date).toISOString().split("T")[0];

    // find attendance
    const attendance = await Attendance.findOne({
      classId,
      subjectId,
      date: formattedDate,
    })
      .populate("records.studentId", "name rollNum")
      .lean();

    if (!attendance) {
      return res.status(200).json({
        message: "No attendance found for this date, Mark the attendance!!",
      });
    }

    // Transform attendance records to include only the necessary details
    const transformedRecords = attendance.records.map((record) => ({
      name: record.studentId.name,
      rollNum: record.studentId.rollNum,
      status: record.status,
    }));

    return res.status(200).json({
      classId: attendance.classId,
      subjectId: attendance.subjectId,
      date: attendance.date,
      records: transformedRecords,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching attendance for this date",
      error: error.message,
    });
  }
};

const getAttendancePercentage = async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    const student = await Student.findById(studentId).lean();

    if (!student) {
      return res.status(404).json({ message: "Student Not Found!!" });
    }

    const attendanceOfSubject = student.attendance.filter(
      (record) => record.subName.toString() === subjectId
    );

    if (attendanceOfSubject.length === 0) {
      return res.status(404).json({
        message: "No attendance for this subject till now",
      });
    }

    // calculate attendance percentage
    const subject = await Subject.findById(subjectId).lean();
    if (!subject) {
      return res.status(404).json({ message: "Subject Not Found!!" });
    }
    const totalClasses = subject.sessions;
    const presentClasses = attendanceOfSubject.filter(
      (record) => record.status === "Present"
    ).length;

    const attendancePercentage =
      totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    return res.status(200).json({
      message: "Attendance percentage fetched successfully!!",
      totalClasses,
      presentClasses,
      percentage: `${attendancePercentage.toFixed(2)}`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while fetching Attendance Percentage",
      error: error.message,
    });
  }
};

module.exports = {
  checkAndMarkAttendance,
  getAttendanceByDate,
  getAttendancePercentage,
};
