const dotenv = require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4000;
const uri = process.env.uri;
const passport = require("passport");
require("./config/passport")(passport);
const flash = require("connect-flash");
const session = require("express-session");
const MongoStore = require("connect-mongo");

//Connect to MongoDB
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

// //express session
// app.use(
//   session({
//     secret: process.env.secret,
//     resave: true,
//     saveUninitialized: true,
//     store: MongoStore.create({
//       mongoUrl: process.env.uri,
//     }),
//   })
// );

// Configure session middleware express
app.use(
  session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.uri,
      ttl: 1 * 24 * 60 * 60, // Set session expiration time in MongoDB (1 day)
      autoRemove: "native", // Removes expired sessions automatically
    }),
    cookie: {
      maxAge: 15 * 60 * 1000, // Session expires in 15 minutes (client-side cookie)
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie (security)
      secure: process.env.NODE_ENV === "production", // Ensures cookies are only sent over HTTPS when in production
    },
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
