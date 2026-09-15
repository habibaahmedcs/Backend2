require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

const ADMIN_EMAIL = "admin@mazakmasr.com";
const ADMIN_PASSWORD = "Admin1234";
const USER_EMAIL = "user@mazakmasr.com";
const USER_PASSWORD = "User1234";

const upsertUser = async ({ firstName, lastName, email, password, role, city, phone }) => {
  let user = await User.findOne({ email }).select("+password");
  if (!user) {
    user = await User.create({ firstName, lastName, email, password, role, city, phone });
    console.log(`Created ${role}: ${email}`);
    return user;
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.role = role;
  user.city = city;
  user.phone = phone;
  user.password = password;
  await user.save();
  console.log(`Updated ${role}: ${email}`);
  return user;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await upsertUser({
      firstName: "Admin",
      lastName: "Mazak",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
      city: "القاهرة",
      phone: "01000000000",
    });

    await upsertUser({
      firstName: "Habiba",
      lastName: "User",
      email: USER_EMAIL,
      password: USER_PASSWORD,
      role: "user",
      city: "الإسكندرية",
      phone: "01111111111",
    });

    console.log("\nLogin accounts:");
    console.log(`  Admin  -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`  User   -> ${USER_EMAIL} / ${USER_PASSWORD}`);
    console.log("\nUse the Angular login page at /login");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
