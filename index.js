const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");

const app = express();
const Routes = require("./routes/route.js");

// console.log(process.env.PORT);
const PORT = 5000;

dotenv.config();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false })); // form data ko parse karne me help karta hai becuase frontend se jo data aa rha hai wo json nhi hai wo ek form data hai

const allowedOrigins = [
  "http://localhost:3000",
  "https://school-verse-frontend.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log("Connected to MongoDB"))
  .catch((err) => console.log("NOT CONNECTED TO NETWORK", err));

app.use("/", Routes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.log(err.message);
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Server started at port http://localhost:${PORT}`);
});
