const dotenv = require("dotenv").config();
const express = require("express");
const path = require("path");
const router = express.Router();
const app = express();
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4000;
const uri = process.env.uri;
const passport = require("passport");
require("./config/passport")(passport);
const flash = require("connect-flash");
const session = require("express-session");

//mongoose connection
// mongoose
//   .connect(uri)
//   .then(() => console.log("connected to MongoDB"))
//   .then(() =>
//     app.listen(PORT, () => console.log(`Server Running On Port: ${PORT}`))
//   )
//   .catch((err) => console.log(err));

mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 10000, // 10 seconds
  })
  .then(() => console.log("MongoDB connected successfully"))
  .then(() =>
    app.listen(PORT, () => console.log(`Server Running On Port: ${PORT}`))
  )
  .catch((err) => console.error("MongoDB connection error:", err));

//Set View Engine : EJS
app.set("view engine", "ejs");

//BodyParser
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

//express session
app.use(
  session({
    secret: process.env.secret,
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//use flash
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

//Routes
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));
