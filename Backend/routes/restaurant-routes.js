const express = require("express");
const restaurantController = require("../controllers/restaurant-controller");
const authenticateMiddleware = require("../middlewares/auth-middleware");
const authorizeMiddleware = require("../middlewares/authorize-middleware");
const upload = require("../middlewares/multer-middleware");

const router = express.Router();

router.get("/", restaurantController.getAllRestaurants);
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
  upload.single("image"),
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
  upload.single("image"),
  restaurantController.updateRestaurant
);
router.delete(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("admin"),
  restaurantController.deleteRestaurant
);
router.get("/:id", restaurantController.getRestaurantById);

module.exports = router;
