const mongoose = require("mongoose");

// Define the Comment schema
const commentSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const ComplaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    min: 3,
    max: 100,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    min: 5,
    max: 300,
    trim: true,
  },
  status: {
    type: String,
    required: true,
    default: "Pending",
  },
  comments: [commentSchema], // Embed the Comment schema within the Complaint schema
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: String,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Complaints = mongoose.model("Complaints", ComplaintSchema);

module.exports = Complaints;
