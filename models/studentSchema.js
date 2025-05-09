const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rollNum: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  sclassName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "sclass",
    required: true,
  },
  parentEmail: {
    type: String,
    required: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    required: true,
  },
  role: {
    type: String,
    default: "Student",
  },
  examResult: [
    {
      subName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
      },
      marksObtained: {
        type: Number,
        default: 0,
      },
    },
  ],
  attendance: [
    {
      date: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: ["Present", "Absent", "Absent with Apology"],
        required: true,
      },
      subName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
        required: true,
      },
    },
  ],
  // assignments: [
  //   {
  //     deadline: {
  //       type: Date,
  //       required: true,
  //     },
  //     description: {
  //       type: String,
  //       required: true,
  //     },
  //     file: {
  //       type: String,
  //     },
  //     subjectId: {
  //       type: mongoose.Schema.Types.ObjectId,
  //       required: true,
  //     },
  //   },
  // ],
  fees: [
    {
      month: {
        type: String,
        enum: [
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
        ],
        required: true,
      },
      year: {
        type: Number,
        default: new Date().getFullYear(),
      },
      amount: {
        type: Number,
        default: 1000, // Default fee amount
      },
      isPaid: {
        type: Boolean,
        default: false,
      },
      paidDate: {
        type: Date,
      },
    },
  ],
});

module.exports = mongoose.model("student", studentSchema);
