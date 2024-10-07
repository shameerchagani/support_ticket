const User = require("../models/user");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { forwardAuthenticated } = require("../config/auth");
const { ensureAuthenticated } = require("../config/auth");

//Login Handler
const user_login_handle = (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/complaints",
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
  const users = await User.find({});
  const { name, email, password, password2, role } = req.body;
  let errors = [];
  //console.log(req.body);
  //console.log(' Name ' + name + ' email :' + email + ' pass:' + password + 'role:' + role);
  if (!name || !email || !password || !password2 || !role) {
    errors.push({ msg: "Please fill in all fields" });
  }

  //check if match
  if (password !== password2) {
    errors.push({ msg: "passwords dont match" });
  }

  if (errors.length > 0) {
    res.render("manageUsers", {
      errors: errors,
      name: name,
      email: email,
      password: password,
      password2: password2,
      role: role,
      user: req.user,
    });
  } else {
    //validation passed
    User.findOne({ email: email }).exec((err, user) => {
      // console.log(user);
      if (user) {
        errors.push({ msg: "Email already registered" });
        res.render("manageUsers", {
          errors,
          users,
          user: req.user,
        });
      } else {
        const newUser = new User({
          name: name,
          email: email,
          password: password,
          role: role,
        });

        //hash password
        bcrypt.genSalt(10, (err, salt) =>
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            //save pass to hash
            newUser.password = hash;
            //save user
            newUser
              .save()
              .then((value) => {
                // console.log(value);
                req.flash("success_msg", "User Created Successfully");
                res.redirect("/users/manageUsers");
              })
              .catch((value) => console.log(value));
          })
        );
      }
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
  if (req.user.role !== "admin") {
    return res.render("404", { title: "404 - Not found", user: req.user });
  }
  const users = await User.find().sort({ name: 1, role: 1 });
  //console.log(users)
  res.render("manageUsers", {
    title: "All Users",
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
