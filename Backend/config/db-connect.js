const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); 
    console.log("Database connection successfully");
  } catch (error) {
    console.log(`Database connection failed: ${error.message}`);
  }
};

module.exports = dbConnect;