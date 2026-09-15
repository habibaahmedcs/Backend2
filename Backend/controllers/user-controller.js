const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Restaurant = require("../models/restaurant");
const { firstFilePath } = require("../utils/media");

const sanitizePhone = (phone) => {
  if (phone === undefined || phone === null) return undefined;
  const cleaned = String(phone).replace(/[\s-]/g, "").trim();
  return cleaned;
};

const splitName = (rawName, firstName, lastName, fname, lname) => {
  const fromPartsFirst = firstName || fname;
  const fromPartsLast = lastName || lname;
  if (fromPartsFirst && fromPartsLast) {
    return { firstName: String(fromPartsFirst).trim(), lastName: String(fromPartsLast).trim() };
  }

  const name = (rawName || "").trim();
  if (!name && fromPartsFirst) {
    const first = String(fromPartsFirst).trim();
    return { firstName: first, lastName: first };
  }
  if (!name) return {};

  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0] || "";
  const last = parts.slice(1).join(" ") || first;
  return { firstName: first, lastName: last };
};

const toPublicUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  obj.name = `${obj.firstName || ""} ${obj.lastName || ""}`.trim();
  return obj;
};

const attachOwnerStatus = async (user) => {
  const publicUser = toPublicUser(user);
  if (!publicUser?._id) return publicUser;

  const listings = await Restaurant.find({ owner: publicUser._id }).select("status").lean();
  const hasApproved = listings.some((item) => item.status === "approved");
  const hasPending = listings.some((item) => item.status === "pending");
  const hasClosed = listings.some((item) => item.status === "rejected" || item.status === "deleted");

  if (hasApproved) {
    publicUser.ownerStatus = "approved";
  } else if (hasPending) {
    publicUser.ownerStatus = "pending";
  } else if (hasClosed) {
    publicUser.ownerStatus = "rejected";
  } else if (publicUser.ownerStatus) {
    publicUser.ownerStatus = publicUser.ownerStatus;
  } else {
    publicUser.ownerStatus = "none";
  }

  if (hasApproved && publicUser.role === "user") {
    publicUser.role = "vendor";
  }

  return publicUser;
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }

    const publicUser = await attachOwnerStatus(user);
    res.status(200).json({
      status: "success",
      data: { user: publicUser },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const { firstName, lastName, fname, lname, name, phone, city } = body;
    const updates = {};

    const names = splitName(name, firstName, lastName, fname, lname);
    if (names.firstName) updates.firstName = names.firstName;
    if (names.lastName) updates.lastName = names.lastName;

    if (phone !== undefined) {
      const cleaned = sanitizePhone(phone);
      updates.phone = cleaned || "";
    }

    if (city !== undefined) {
      updates.city = String(city).trim();
    }

    const avatarPath = firstFilePath(req, ["avatar", "image"]);
    if (avatarPath) {
      updates.imageUrl = avatarPath;
    }

    if (Object.keys(updates).length === 0) {
      const current = await User.findById(req.userId);
      if (!current) {
        return res.status(404).json({ status: "fail", message: "User not found" });
      }
      return res.status(200).json({
        status: "success",
        message: "No changes submitted",
        data: { user: await attachOwnerStatus(current) },
      });
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
      data: { user: await attachOwnerStatus(updatedUser) },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error updating profile: ${error.message}`,
    });
  }
};

const changePassword = async (req, res) => {
  try {
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

module.exports = { getProfile, updateProfile, changePassword, attachOwnerStatus, toPublicUser };
