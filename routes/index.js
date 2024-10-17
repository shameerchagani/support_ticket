const express = require("express");
const { ensureAuthenticated } = require("../config/auth");
const router = express.Router();
const complaintsController = require("../controlers/complaintsController");

//login page
router.get("/", (req, res) => {
  res.render("login", { title: "Login", appName: "Codepro Support" });
});

//Dashboard
router.get(
  "/dashboard",
  ensureAuthenticated,
  complaintsController.dashboard_get
);

//'===================================
//Complaints Routes
//'===================================

//Get Complaints
router.get(
  "/complaints",
  ensureAuthenticated,
  complaintsController.complaints_get
);

//Add Complaints
router.post(
  "/addComplaint",
  ensureAuthenticated,
  complaintsController.complaints_add_handle
);

//Get Complaints Details
router.get(
  "/complaints/:id",
  ensureAuthenticated,
  complaintsController.complaintDetails_get
);

//Add Comments to Complaints
router.post(
  "/complaints/:id/comments",
  ensureAuthenticated,
  complaintsController.complaintComment_post
);

//Update Complaints status as pending
router.get(
  "/complaintInProgress/:id",
  ensureAuthenticated,
  complaintsController.complaint_update_pending
);

//Update Complaints status as inprogress
router.get(
  "/complaintInProgress/:id",
  ensureAuthenticated,
  complaintsController.complaint_update_inProgress
);

//Update Complaints status as closed
router.get(
  "/complaintClose/:id",
  ensureAuthenticated,
  complaintsController.complaint_update_close
);

// router.get("*", (req, res) => {
//   res.render("404", { title: "404 - Not found", user: req.user });
// });

module.exports = router;
