const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  date: Date,
  records: [
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "student",
        required: true,
      },
      status: {
        type: String,
        enum: ["Present", "Absent", "Absent with Apology"],
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("attendance", attendanceSchema);
