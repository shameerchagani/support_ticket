const Complaints = require("../models/complaints");

const passport = require("passport");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const { forwardAuthenticated } = require("../config/auth");
const { ensureAuthenticated } = require("../config/auth");

//Complaints Controllers

//Dashboard Data management controller.
const dashboard_get = async (req, res) => {
  if (!req.user) {
    req.flash("error_msg", "Please login to access this page");
    res.redirect("/");
  } else if (req.user && req.user.role === "admin") {
    // Get ticket counts for the dashboard

    try {
      // Get today's date and set time to 00:00:00 for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Date 7 days ago and 30 days ago
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);

      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);

      // Count tickets for today, last 7 days, and last 30 days
      const todayCount = await Complaints.countDocuments({
        createdAt: { $gte: today },
      });

      const last7DaysCount = await Complaints.countDocuments({
        createdAt: { $gte: last7Days },
      });

      const last30DaysCount = await Complaints.countDocuments({
        createdAt: { $gte: last30Days },
      });

      // Send the result as a response
      res.status(200).render("dashboard", {
        todayCount,
        last7DaysCount,
        last30DaysCount,
        user: req.user,
        title: "Dashboard",
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching ticket counts", error });
    }
  } else {
    try {
      const complaints = await Complaints.find({ createdBy: req.user }).sort({
        createdAt: -1,
      });
      res.render("complaints", {
        title: "Complaints",
        user: req.user,
        complaints: complaints,
      });
    } catch (error) {
      console.log(error);
    }
  }
};

//Get Complaints Controller by user role
const complaints_get = async (req, res) => {
  if (!req.user) {
    req.flash("error_msg", "Please login to access this page");
    res.redirect("/");
  } else if (req.user && req.user.role === "admin") {
    try {
      const complaints = await Complaints.find().sort({ createdAt: -1 });
      res.render("complaints", {
        title: "Complaints",
        user: req.user,
        complaints: complaints,
      });
    } catch (error) {
      console.log(error);
    }
  } else if (req.user && req.user.role !== "admin") {
    try {
      const complaints = await Complaints.find({
        createdBy: req.user.name,
      }).sort({ createdAt: -1 });
      res.render("complaints", {
        title: "Complaints",
        user: req.user,
        complaints: complaints,
      });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.render("404", {
      title: "404 - Not Found",
    });
  }
};

//Add Complaints Handle
const complaints_add_handle = async (req, res) => {
  const { title, description } = req.body;
  let errors = [];
  if (!title || !description) {
    errors.push({ msg: "All Fields are Mandetory" });
  }
  if (errors.length > 0) {
    res.render("complaints", {
      title: "Complaints",
      user: req.user,
    });
  }
  try {
    const addComplaint = new Complaints({
      title: req.body.title.toLowerCase(),
      description: req.body.description.toLowerCase(),
      createdBy: req.user.name,
    });
    await addComplaint.save();
    req.flash("success_msg", "Complaints added successfully");
    res.redirect("/complaints");
  } catch (error) {
    // Handle error here
    console.log(error);
    req.flash("error_msg", "Something went wrong!");
    res.redirect("/complaints");
  }
};

//Complaint Details
const complaintDetails_get = (req, res) => {
  Complaints.findOne({ _id: req.params.id })
    .then((result) => {
      res.render("complaintDetails", {
        title: "Complaint Details",
        complaint: result,
        user: req.user,
        fromNow: moment(result.createdAt).fromNow(true),
      });
    })
    .catch((err) => console.log(err));
};

//complaint comments Post Handler

const complaintComment_post = async (req, res) => {
  const complaint = await Complaints.findById(req.params.id);
  const { comment } = req.body;
  let errors = [];
  if (!comment) {
    errors.push({ msg: "Comment is required" });
  }

  if (errors.length > 0) {
    res.render("complaintDetails", {
      title: "Complaint Details",
      user: req.user,
      complaint: complaint,
      errors,
      fromNow: moment(complaint.createdAt).fromNow(true),
    });
  }

  try {
    // Find the complaint by ID
    const complaint = await Complaints.findById(req.params.id);
    if (!complaint) {
      return res.status(404).send("Complaint not found!");
    }

    // Create a new comment and push it to the begining of comments array of the complaint
    complaint.comments.unshift({
      user: req.user.name,
      text: req.body.comment.toLowerCase(),
    });

    // Save the updated complaint
    await complaint.save();

    // Respond with a success message and redirect to the complaint details page
    req.flash("success_msg", "Comment added successfully");
    res.render("complaintDetails", {
      user: req.user,
      title: "Complaint Details",
      complaint: complaint,
      fromNow: moment(complaint.createdAt).fromNow(true),
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("404");
  }
};

const complaint_update_pending = async (req, res, next) => {
  try {
    // Find the complaint and update its status to "In-Progress"
    await Complaints.findByIdAndUpdate(req.params.id, {
      $set: { status: "pending" },
      updatedBy: req.user.name,
      updatedAt: Date.now(),
    });

    // Flash a success message and redirect to the complaints page
    req.flash("success_msg", "Status updated successfully");
    res.redirect("/complaints");
  } catch (err) {
    // If an error occurs, pass it to the next middleware (error handling)
    next(err);
  }
};

//Update Complaint Controller mark ticket as inProgress
const complaint_update_inProgress = async (req, res, next) => {
  try {
    // Find the complaint and update its status to "In-Progress"
    await Complaints.findByIdAndUpdate(req.params.id, {
      $set: { status: "In-Progress" },
      updatedBy: req.user.name,
      updatedAt: Date.now(),
    });

    // Flash a success message and redirect to the complaints page
    req.flash("success_msg", "Status updated successfully");
    res.redirect("/complaints");
  } catch (err) {
    // If an error occurs, pass it to the next middleware (error handling)
    next(err);
  }
};

//Update Complaint Controller mark ticket as Closed
const complaint_update_close = async (req, res, next) => {
  try {
    await Complaints.findByIdAndUpdate(req.params.id, {
      $set: {
        status: "Closed",
      },
      updatedBy: req.user.name,
      updatedAt: Date.now(),
    });
    req.flash("success_msg", "Status Updated Successfully");
    res.redirect("/complaints");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  complaints_get,
  complaints_add_handle,
  complaintDetails_get,
  complaintComment_post,
  complaint_update_pending,
  complaint_update_inProgress,
  complaint_update_close,
  dashboard_get,
};
