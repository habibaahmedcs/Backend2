const express = require("express");
const restaurantController = require("../controller/Restaurant-controller");
const authenticateMiddleware = require("../middlewares/auth-middleware");
const authorizeMiddleware = require("../middlewares/authorize-middleware");
const upload = require("../middlewares/multer-middleware"); 

const router = express.Router();

// 1. جميع المطاعم
router.get("/", restaurantController.getAllRestaurants);

// 2. المطاعم المقبولة فقط (قبل /:id)
router.get("/approved", restaurantController.getApprovedRestaurants);

// 3. مطاعم المستخدم الحالي
router.get(
  "/mine",
  authenticateMiddleware,
  restaurantController.getMyRestaurants
);

// 4. الطلبات المعلقة للأدمن
router.get(
  "/pending",
  authenticateMiddleware,
  authorizeMiddleware("admin"),
  restaurantController.getPendingRestaurants
);

// 5. إضافة مطعم
router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("admin", "user"),
  upload.single("image"), 
  restaurantController.createRestaurant
);

// 6. قبول مطعم
router.put(
  "/:id/approve",
  authenticateMiddleware,
  authorizeMiddleware("admin"),
  restaurantController.approveRestaurant
);

// 7. رفض مطعم
router.put(
  "/:id/reject",
  authenticateMiddleware,
  authorizeMiddleware("admin"),
  restaurantController.rejectRestaurant
);

// 8. تعديل مطعم
router.patch(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("admin"),
  upload.single("image"),
  restaurantController.updateRestaurant
);

// 9. حذف مطعم
router.delete(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("admin"),
  restaurantController.deleteRestaurant
);

// 10. جلب مطعم بـ ID (دائماً في النهاية)
router.get("/:id", restaurantController.getRestaurantById);

module.exports = router;