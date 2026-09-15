const express = require("express");
const { getProfile, updateProfile, changePassword } = require("../controllers/user-controller");
const authenticateMiddleware = require("../middlewares/auth-middleware");
const upload = require("../middlewares/multer-middleware");

const router = express.Router();

router.get("/profile", authenticateMiddleware, getProfile);
router.put("/profile", authenticateMiddleware, upload.single("image"), updateProfile);
router.put("/change-password", authenticateMiddleware, changePassword);

module.exports = router;