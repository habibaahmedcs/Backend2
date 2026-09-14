const bcrypt = require("bcryptjs");
const User = require("../models/user");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// تعديل البيانات الشخصية
const updateProfile = async (req, res) => {
  try {
    const updates = {};
    const { firstName, lastName, fname, lname, name, phone } = req.body;

    // توافق الأسماء بين الفرونت إند والباك إند
    if (firstName) updates.firstName = firstName;
    else if (fname) updates.firstName = fname;
    else if (name) updates.firstName = name.trim().split(" ")[0];

    if (lastName) updates.lastName = lastName;
    else if (lname) updates.lastName = lname;
    else if (name) updates.lastName = name.trim().split(" ").slice(1).join(" ") || updates.firstName;

    if (phone !== undefined) updates.phone = phone;

    if (req.file) {
      updates.imageUrl = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error updating profile: ${error.message}`,
    });
  }
};

// تغيير كلمة المرور
const changePassword = async (req, res) => {
  try {
    // استقبال currentPassword من الفرونت إند أو oldPassword
    const oldPassword = req.body.currentPassword || req.body.oldPassword;
    const { newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: "fail",
        message: "New password must be at least 8 characters long.",
      });
    }

    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        message: "Old password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error changing password: ${error.message}`,
    });
  }
};

module.exports = { getProfile, updateProfile, changePassword };