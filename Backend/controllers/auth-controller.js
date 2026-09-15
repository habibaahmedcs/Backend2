const bcrypt = require("bcryptjs");
const User = require("../models/user");
const generateToken = require("../utils/get-jwt");
const { attachOwnerStatus } = require("./user-controller");
const { toStoredPath } = require("../utils/media");

const signup = async (req, res) => {
  try {
    const imageUrl = req.file ? toStoredPath(req.file) : "default-user.webp";
    const user = await User.create({
      firstName: req.body.firstName || req.body.fname,
      lastName: req.body.lastName || req.body.lname,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone || "",
      city: req.body.city || "",
      imageUrl,
      role: "user",
    });

    const token = generateToken(user);
    const publicUser = await attachOwnerStatus(user);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      token,
      data: { user: publicUser },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error in signup: ${error.message}`,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password",
      });
    }

    user.password = undefined;
    const token = generateToken(user);
    const publicUser = await attachOwnerStatus(user);

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      token,
      data: { user: publicUser },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error in login: ${error.message}`,
    });
  }
};

module.exports = { signup, login };
