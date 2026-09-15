const Restaurant = require("../models/restaurant");
const User = require("../models/user");
const { normalizeCuisine, cuisineQuery, parseMenuItems } = require("../utils/cuisine-map");
const { firstFilePath, allFilePaths, applyMenuImages } = require("../utils/media");

const buildPublicFilter = (query = {}) => {
  const filter = { status: "approved" };
  const and = [];

  if (query.type === "restaurant" || query.type === "home_kitchen") {
    filter.type = query.type;
  }

  if (query.country) {
    filter.country = { $regex: query.country, $options: "i" };
  }

  const cuisineFilter = cuisineQuery(query.cuisine);
  if (cuisineFilter) {
    and.push(cuisineFilter);
  }

  const q = (query.q || query.search || "").trim();
  if (q) {
    and.push({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { cuisine: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    });
  }

  if (and.length) {
    filter.$and = and;
  }

  return filter;
};

const parseTags = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((tag) => String(tag).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((tag) => String(tag).trim()).filter(Boolean);
  } catch {
    return String(raw)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const parseGalleryKeep = (body) => {
  if (!body) return undefined;
  const raw = body.galleryKeep;
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const withImage = (restaurant) => {
  if (!restaurant) return restaurant;
  const obj = restaurant.toObject ? restaurant.toObject() : { ...restaurant };
  obj.coverImage = obj.coverImage || obj.imageUrl || obj.image || "";
  obj.thumbnail = obj.thumbnail || obj.imageUrl || obj.image || "";
  obj.image = obj.thumbnail || obj.coverImage || obj.imageUrl || obj.image || "";
  obj.imageUrl = obj.imageUrl || obj.coverImage || obj.thumbnail || obj.image || "";
  obj.healthCertificate = obj.healthCertificate || "";
  obj.gallery = Array.isArray(obj.gallery) ? obj.gallery.filter(Boolean) : [];
  obj.rating = obj.averageRating || 0;
  obj.menu = (obj.menu || []).map((item) => ({
    ...item,
    image: item.imageUrl || item.image || "",
    imageUrl: item.imageUrl || item.image || "",
  }));
  obj.menuItems = obj.menu;
  obj.reviews = (obj.reviews || []).map((review) => {
    const populatedUser = review.user && typeof review.user === "object" ? review.user : null;
    return {
      ...review,
      userName: review.userName || `${populatedUser?.firstName || ""} ${populatedUser?.lastName || ""}`.trim() || "مستخدم",
      userAvatar: review.userAvatar || populatedUser?.imageUrl || "",
    };
  });
  return obj;
};

const extractListingMedia = (req) => {
  const cover = firstFilePath(req, ["cover", "coverImage"]);
  const thumbnail = firstFilePath(req, ["thumbnail"]);
  const generic = firstFilePath(req, ["image"]);
  const healthCertificate = firstFilePath(req, ["healthCertificate", "proof"]);
  const galleryUploads = allFilePaths(req, "gallery");
  return { cover, thumbnail, generic, healthCertificate, galleryUploads };
};

const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.status(200).json({
      status: "success",
      count: restaurants.length,
      data: { restaurants: restaurants.map(withImage) },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error fetching restaurants: ${error.message}`,
    });
  }
};

const getApprovedRestaurants = async (req, res) => {
  try {
    const filter = buildPublicFilter(req.query);
    const limit = Math.min(Number(req.query.limit) || 0, 50);
    const sortByRating = req.query.sort === "rating";

    let query = Restaurant.find(filter);
    query = sortByRating
      ? query.sort({ averageRating: -1, ratingsCount: -1, createdAt: -1 })
      : query.sort({ createdAt: -1 });

    if (limit) query = query.limit(limit);

    const approvedRestaurants = await query;
    res.status(200).json({
      status: "success",
      count: approvedRestaurants.length,
      data: { restaurants: approvedRestaurants.map(withImage) },
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
    cuisine = normalizeCuisine(cuisine);
    if (!cuisine) {
      return res.status(400).json({ status: "fail", message: "المطبخ/الدولة مطلوب" });
    }

    const priceLevel = req.body.priceLevel ? String(req.body.priceLevel).toLowerCase() : undefined;
    const media = extractListingMedia(req);
    const coverImage = media.cover || media.generic || "";
    const thumbnail = media.thumbnail || media.generic || coverImage;
    const healthCertificate = media.healthCertificate || "";
    const gallery = media.galleryUploads;

    const owner = req.userId;
    const listingType = req.body.type === "home_kitchen" ? "home_kitchen" : "restaurant";
    const menu = applyMenuImages(parseMenuItems(req.body) || [], req);

    const newRestaurant = await Restaurant.create({
      name: req.body.name,
      type: listingType,
      cuisine,
      country: req.body.country || "",
      location: req.body.location,
      phone: req.body.phone || "",
      description: req.body.description || "",
      workingHours: req.body.workingHours || "",
      averagePrice: req.body.averagePrice,
      priceLevel,
      imageUrl: coverImage || thumbnail,
      image: thumbnail || coverImage,
      coverImage,
      thumbnail,
      healthCertificate,
      gallery,
      menu,
      owner,
      status: "pending",
    });

    await User.findByIdAndUpdate(owner, { ownerStatus: "pending" });

    res.status(201).json({
      status: "success",
      message: "Restaurant submitted successfully and is pending admin approval",
      data: { restaurant: withImage(newRestaurant) },
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
    const restaurant = await Restaurant.findById(req.params.id)
      .populate("owner", "firstName lastName email")
      .populate("reviews.user", "firstName lastName imageUrl");
    if (!restaurant) {
      return res.status(404).json({ status: "error", message: "Restaurant not found" });
    }

    res.status(200).json({
      status: "success",
      data: { restaurant: withImage(restaurant) },
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
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ status: "error", message: "Restaurant not found" });
    }

    if (restaurant.owner?.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "You are not authorized to update this restaurant",
      });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.type !== undefined) {
      updates.type = req.body.type === "home_kitchen" ? "home_kitchen" : "restaurant";
    }
    if (req.body.location !== undefined) updates.location = req.body.location;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.workingHours !== undefined) updates.workingHours = req.body.workingHours;
    if (req.body.country !== undefined) updates.country = req.body.country;
    if (req.body.averagePrice !== undefined) updates.averagePrice = req.body.averagePrice;

    if (req.body.cuisine) {
      let cuisine = req.body.cuisine;
      if (cuisine === "أخرى" || cuisine === "other") {
        cuisine = req.body.customCuisine || "other";
      }
      updates.cuisine = normalizeCuisine(cuisine);
    }

    if (req.body.priceLevel) {
      updates.priceLevel = String(req.body.priceLevel).toLowerCase();
    }

    const menu = parseMenuItems(req.body);
    if (menu) updates.menu = applyMenuImages(menu, req);

    const media = extractListingMedia(req);
    if (media.cover) {
      updates.coverImage = media.cover;
      updates.imageUrl = media.cover;
    }
    if (media.thumbnail) {
      updates.thumbnail = media.thumbnail;
      updates.image = media.thumbnail;
    }
    if (media.generic) {
      if (!updates.coverImage) {
        updates.coverImage = media.generic;
        updates.imageUrl = media.generic;
      }
      if (!updates.thumbnail) {
        updates.thumbnail = media.generic;
        updates.image = media.generic;
      }
    }
    if (media.healthCertificate) {
      updates.healthCertificate = media.healthCertificate;
    }

    const keptGallery = parseGalleryKeep(req.body);
    if (keptGallery || media.galleryUploads.length) {
      const baseGallery = keptGallery || restaurant.gallery || [];
      updates.gallery = [...baseGallery, ...media.galleryUploads].filter(Boolean);
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      message: "Restaurant updated successfully",
      data: { restaurant: withImage(updatedRestaurant) },
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
      return res.status(404).json({ status: "error", message: "Restaurant not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Restaurant deleted",
      data: { restaurant: withImage(deletedRestaurant) },
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
      data: { restaurants: myRestaurants.map(withImage) },
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
    const pendingRestaurants = await Restaurant.find({ status: "pending" })
      .populate("owner", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: pendingRestaurants.length,
      data: { restaurants: pendingRestaurants.map(withImage) },
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

    if (approvedRestaurant.owner) {
      await User.findByIdAndUpdate(approvedRestaurant.owner, {
        role: "vendor",
        ownerStatus: "approved",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Restaurant approved successfully and owner upgraded to vendor",
      data: { restaurant: withImage(approvedRestaurant) },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error approving restaurant: ${error.message}`,
    });
  }
};

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

    if (rejectedRestaurant.owner) {
      const stillPending = await Restaurant.exists({
        owner: rejectedRestaurant.owner,
        status: "pending",
      });
      const stillApproved = await Restaurant.exists({
        owner: rejectedRestaurant.owner,
        status: "approved",
      });
      await User.findByIdAndUpdate(rejectedRestaurant.owner, {
        ownerStatus: stillApproved ? "approved" : stillPending ? "pending" : "rejected",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Restaurant rejected successfully",
      data: { restaurant: withImage(rejectedRestaurant) },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error rejecting restaurant: ${error.message}`,
    });
  }
};

const ownerIdOf = (restaurant) => {
  if (!restaurant?.owner) return "";
  if (typeof restaurant.owner === "object") {
    return (restaurant.owner._id || restaurant.owner.id || "").toString();
  }
  return restaurant.owner.toString();
};

const addReview = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ status: "error", message: "Restaurant not found" });
    }

    if (restaurant.status !== "approved") {
      return res.status(400).json({
        status: "fail",
        message: "You can only review approved listings",
      });
    }

    if (ownerIdOf(restaurant) === req.userId) {
      return res.status(403).json({
        status: "fail",
        message: "لا يمكنك تقييم قائمتك الخاصة / You cannot rate your own listing",
      });
    }

    const rating = Number(req.body.rating);
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: "fail",
        message: "Rating must be a number between 1 and 5",
      });
    }

    const userName =
      `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || req.user.email || "مستخدم";
    const comment = req.body.comment || req.body.review || "";
    const tags = parseTags(req.body.tags);
    const userAvatar =
      req.user.imageUrl && req.user.imageUrl !== "default-user.webp" ? req.user.imageUrl : "";

    const existing = restaurant.reviews.find((review) => review.user?.toString() === req.userId);
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      existing.userName = userName;
      existing.tags = tags;
      existing.userAvatar = userAvatar;
    } else {
      restaurant.reviews.push({
        user: req.userId,
        userName,
        userAvatar,
        rating,
        comment,
        tags,
      });
    }

    restaurant.recalculateRatings();
    await restaurant.save();

    res.status(201).json({
      status: "success",
      message: "Review saved successfully",
      data: { restaurant: withImage(restaurant) },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Error adding review: ${error.message}`,
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
  addReview,
};
