const bcrypt = require("bcryptjs");
const User = require("../models/user");
const generateToken = require("../utils/get-jwt");

const signup = async (req, res) => {
  try {
    const user = await User.create({
      ...req.body,
      role: req.body.role || "user",
    });

    const token = generateToken(user);
    user.password = undefined;

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      token,
      data: { user },
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

    const user = await User.findOne({ email }).select("+password");
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

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      token,
      data: { user },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error in login: ${error.message}`,
    });
  }
};

module.exports = { signup, login };