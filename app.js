const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const usermodel = require("./models/mon");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.set("view engine", "ejs");

// Multer Storage Config
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage });

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect("/login");
  }
};

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await usermodel.findOne({ email: req.user.email });
    if (!user) return res.redirect("/logout");

    res.render("profile", { name: user.name, image: `/uploads/${user.image}` });
  } catch (err) {
    console.error(err);
    res.redirect("/login");
  }
});

// Create User (Signup)
app.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { name, email, age, password } = req.body;
    const image = req.file ? req.file.filename : "default.png";

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await usermodel.create({
      name,
      email,
      age,
      password: hash,
      image,
    });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating user");
  }
});

// Login Page
app.get("/login", (req, res) => {
  res.render("login");
});

// Login Authentication
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await usermodel.findOne({ email });

    if (!user) {
      return res.send("User not found");
    }

    const result = await bcrypt.compare(password, user.password);

    if (result) {
      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
      res.cookie("token", token, { httpOnly: true });
      res.redirect("/profile");
    } else {
      res.send("Wrong password");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Login error");
  }
});

// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Yes_Brain😎 Server is running on port ${PORT}`);
});
