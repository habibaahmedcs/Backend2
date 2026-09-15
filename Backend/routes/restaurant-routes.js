const express = require("express");
const restaurantController = require("../controllers/restaurant-controller");
const authenticateMiddleware = require("../middlewares/auth-middleware");
const optionalAuthenticate = authenticateMiddleware.optionalAuthenticate;
const authorizeMiddleware = require("../middlewares/authorize-middleware");
const upload = require("../middlewares/multer-middleware");

const router = express.Router();

router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("admin"),
  restaurantController.getAllRestaurants
);
router.get("/approved", restaurantController.getApprovedRestaurants);
router.get("/search", restaurantController.getApprovedRestaurants);
router.get("/mine", authenticateMiddleware, restaurantController.getMyRestaurants);
router.get(
  "/pending",
  authenticateMiddleware,
  authorizeMiddleware("admin"),
  restaurantController.getPendingRestaurants
);
router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("admin", "vendor", "user"),
  upload.listingFields,
  restaurantController.createRestaurant
);
router.post(
  "/:id/reviews",
  authenticateMiddleware,
  restaurantController.addReview
);
router.put(
  "/:id/approve",
  authenticateMiddleware,
  authorizeMiddleware("admin"),
  restaurantController.approveRestaurant
);
router.put(
  "/:id/reject",
  authenticateMiddleware,
  authorizeMiddleware("admin"),
  restaurantController.rejectRestaurant
);
router.patch(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("admin", "vendor", "user"),
  upload.listingFields,
  restaurantController.updateRestaurant
);
router.put(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("admin", "vendor", "user"),
  upload.listingFields,
  restaurantController.updateRestaurant
);
router.delete(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("admin", "vendor", "user"),
  restaurantController.deleteRestaurant
);
router.get("/:id", optionalAuthenticate, restaurantController.getRestaurantById);

module.exports = router;
