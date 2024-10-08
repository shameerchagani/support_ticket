const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { forwardAuthenticated } = require("../config/auth");
const { ensureAuthenticated } = require("../config/auth");

const userController = require("../controlers/userController");
const entryController = require("../controlers/complaintsController");
//login handle
router.get("/login", forwardAuthenticated, (req, res) => {
  res.render("login", { title: "Login", appName: "Codepro Support" });
});

//Login
router.post("/login", userController.user_login_handle);

//Logout
router.get("/logout", userController.user_logout);

//get all users list
router.get("/manageUsers", userController.user_list);

//create user route
router.post("/createUser", userController.user_create_handle);

//update User get route
router.get(
  "/updateUser/:id",
  ensureAuthenticated,
  userController.user_update_get
);

//update user post route
router.post(
  "/updateUser/:id",
  ensureAuthenticated,
  userController.user_update_handle
);

//Delete User route
router.get("/deleteUser/:id", ensureAuthenticated, userController.user_delete);

module.exports = router;
