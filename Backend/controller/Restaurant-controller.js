const Restaurant = require("../models/ApproveRestaurant");

const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();

    res.status(200).json({
      status: "success",
      count: restaurants.length,
      data: {
        restaurants,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error fetching restaurants: ${error.message}`,
    });
  }
};

// 1. جلب المطاعم المقبولة فقط
const getApprovedRestaurants = async (req, res) => {
  try {
    const approvedRestaurants = await Restaurant.find({ status: "approved" });

    res.status(200).json({
      status: "success",
      count: approvedRestaurants.length,
      data: {
        restaurants: approvedRestaurants,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error fetching approved restaurants: ${error.message}`,
    });
  }
};

const createRestaurant = async (req, res) => {
  try {
    let cuisine = req.body.cuisine;
    if (cuisine === "أخرى" || cuisine === "other") {
      cuisine = req.body.customCuisine || "other";
    }
    cuisine = cuisine?.toLowerCase().trim();
    
    const priceLevel = req.body.priceLevel?.toLowerCase();

    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.path.replace(/\\/g, "/");
    }

    const owner = req.userId;

    const newRestaurant = await Restaurant.create({
      ...req.body,
      cuisine,
      priceLevel,
      imageUrl,
      image: imageUrl,
      owner,
    });

    res.status(201).json({
      status: "success",
      message: "Restaurant submitted successfully and is pending admin approval",
      data: {
        restaurant: newRestaurant,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error creating restaurant: ${error.message}`,
    });
  }
};

const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res
        .status(404)
        .json({ status: "error", message: "Restaurant not found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        restaurant,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error fetching restaurant: ${error.message}`,
    });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    if (req.body.cuisine) {
      let cuisine = req.body.cuisine;
      if (cuisine === "أخرى" || cuisine === "other") {
        cuisine = req.body.customCuisine || "other";
      }
      req.body.cuisine = cuisine.toLowerCase().trim();
    }
    if (req.body.priceLevel) req.body.priceLevel = req.body.priceLevel.toLowerCase();

    if (req.file) {
      const imgPath = req.file.path.replace(/\\/g, "/");
      req.body.imageUrl = imgPath;
      req.body.image = imgPath;
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!updatedRestaurant) {
      return res
        .status(404)
        .json({ status: "error", message: "Restaurant not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Restaurant updated",
      data: {
        restaurant: updatedRestaurant,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error updating restaurant: ${error.message}`,
    });
  }
};

const deleteRestaurant = async (req, res) => {
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!deletedRestaurant) {
      return res
        .status(404)
        .json({ status: "error", message: "Restaurant not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Restaurant deleted",
      data: {
        restaurant: deletedRestaurant,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error deleting restaurant: ${error.message}`,
    });
  }
};

const getMyRestaurants = async (req, res) => {
  try {
    const myRestaurants = await Restaurant.find({ owner: req.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: myRestaurants.length,
      data: {
        restaurants: myRestaurants,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error fetching your restaurants: ${error.message}`,
    });
  }
};

const getPendingRestaurants = async (req, res) => {
  try {
    const pendingRestaurants = await Restaurant.find({ status: "pending" }).populate("owner", "name email");

    res.status(200).json({
      status: "success",
      count: pendingRestaurants.length,
      data: {
        restaurants: pendingRestaurants,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error fetching pending restaurants: ${error.message}`,
    });
  }
};

const approveRestaurant = async (req, res) => {
  try {
    const approvedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true, runValidators: true }
    );

    if (!approvedRestaurant) {
      return res.status(404).json({ status: "error", message: "Restaurant not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Restaurant approved successfully",
      data: {
        restaurant: approvedRestaurant,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error approving restaurant: ${error.message}`,
    });
  }
};

// 2. رفض طلب المطعم (تغيير حالته إلى rejected)
const rejectRestaurant = async (req, res) => {
  try {
    const rejectedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true, runValidators: true }
    );

    if (!rejectedRestaurant) {
      return res.status(404).json({ status: "error", message: "Restaurant not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Restaurant rejected successfully",
      data: {
        restaurant: rejectedRestaurant,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error rejecting restaurant: ${error.message}`,
    });
  }
};

module.exports = {
  getAllRestaurants,
  getApprovedRestaurants,
  createRestaurant,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  getPendingRestaurants,
  approveRestaurant,
  rejectRestaurant,
  getMyRestaurants,
};