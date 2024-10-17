const User = require("../models/user");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { forwardAuthenticated } = require("../config/auth");
const { ensureAuthenticated } = require("../config/auth");

//Login Handler
const user_login_handle = (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
    author: req.body,
    title: "Login",
  })(req, res, next);
};

//Logout Handler
const user_logout = async (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
  });
  await req.flash("success_msg", "Now logged out");
  res.redirect("/users/login");
};

//Add A user to Database
const user_create_handle = async (req, res) => {
  const users = await User.find({}); // Fetch all users
  const { name, email, password, password2, role } = req.body;
  let errors = [];

  //check if user exists
  if (!req.user || req.user.role !== "admin") {
    errors.push({
      msg: "Either you are not logged in or you are not an Admin User!",
    });
    return res.render("login", {
      title: "Login",
    });
  }

  // Check if all fields are filled
  if (!name || !email || !password || !password2 || !role) {
    errors.push({ msg: "Please fill in all fields" });
  }

  // Check if passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  // If there are errors, re-render the form with the errors
  if (req.user && errors.length > 0) {
    return res.render("manageUsers", {
      errors,
      name,
      email,
      password,
      password2,
      role,
      user: req.user,
    });
  }

  try {
    // Check if the email is already registered
    const user = await User.findOne({ email: email });

    if (user) {
      errors.push({ msg: "Email already registered" });
      return res.render("manageUsers", {
        errors,
        users,
        user: req.user,
      });
    }

    // If email is not registered, create a new user
    const newUser = new User({
      name: name,
      email: email,
      password: password,
      role: role,
    });

    // Hash the password before saving the user
    const salt = await bcrypt.genSalt(10); // Generate salt
    newUser.password = await bcrypt.hash(newUser.password, salt); // Hash the password

    // Save the new user to the database
    await newUser.save();

    req.flash("success_msg", "User Created Successfully");
    res.redirect("/users/manageUsers");
  } catch (err) {
    console.error(err);
    return res.render("manageUsers", {
      errors: [{ msg: "Something went wrong, please try again later" }],
      users,
      user: req.user,
    });
  }
};

//Update User get controller
const user_update_get = (req, res) => {
  User.findOne({ _id: req.params.id }).then((result) => {
    //console.log(result)
    res.render("userUpdate", {
      user: req.user,
      title: "Update User",
      selectedUser: result,
    });
  });
};

//Update User POST Controller
const user_update_handle = async (req, res, next) => {
  try {
    const newPassword = req.body.password.trim();
    const newPassword2 = req.body.password2.trim();
    const id = req.params.id;

    //If invalid role is entered
    if (
      (newPassword.length === 0 || newPassword2.length === 0) &&
      req.body.role.trim().length < 4
    ) {
      req.flash("error_msg", "Invalid Role Value");
      return res.redirect(`/users/updateUser/${id}`);
    } else if (
      newPassword.length === 0 ||
      (newPassword2.length === 0 && req.body.role.trim().length >= 4)
    ) {
      const userUpdate = await User.findByIdAndUpdate(req.params.id, {
        $set: { role: req.body.role, updated_date: Date.now() },
      });
      req.flash("success_msg", "User Details Updated successfully");
      return res.redirect("/users/manageUsers");
    } else if (newPassword.length > 0 && newPassword === newPassword2) {
      const hash = await bcrypt.hash(newPassword, 10);
      const userUpdate = await User.findByIdAndUpdate(req.params.id, {
        $set: { role: req.body.role, password: hash, updated_date: Date.now() },
      });
      req.flash("success_msg", "User Role & Password Updated Successfully");
      return res.redirect("/users/manageUsers");
    } else {
      req.flash("error_msg", "Passwords do not match");
      return res.redirect(`/users/updateUser/${id}`);
    }
  } catch (error) {
    // Handle any exceptions
    console.error("Error in user_update_handle:", error);
    req.flash("error_msg", "An error occurred while updating user");
    return res.redirect("/users/manageUsers");
  }
};

//Populate User list
const user_list = async (req, res) => {
  let errors = [];
  if (!req.user || req.user.role !== "admin") {
    errors.push({
      msg: "Either you are not logged in or you are not an Admin User!",
    });
    return res.render("login", { title: "Login", user: req.user });
  }
  const users = await User.find().sort({ name: 1, role: 1 });
  //console.log(users)
  res.render("manageUsers", {
    title: "Manage Users",
    users,
    user: req.user,
  });
};

//Delete User Controller
const user_delete = async (req, res) => {
  if (req.user && req.user.role === "admin") {
    const user = await User.findByIdAndDelete(req.params.id, (err, user) => {
      if (err) return next(err);
      req.flash("success_msg", "User Deleted successfully");
      res.redirect("/users/manageUsers");
    });
  } else {
    req.flash("error_msg", "You are not authorised to delete");
    res.redirect("/404");
  }
};

//Export All Modules.
module.exports = {
  user_login_handle,
  user_logout,
  user_list,
  user_list,
  user_create_handle,
  user_update_get,
  user_update_handle,
  user_delete,
};
