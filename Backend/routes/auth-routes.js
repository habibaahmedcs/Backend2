const express = require("express");
const { signup, login } = require("../controllers/auth-controller");
const upload = require("../middlewares/multer-middleware");

const router = express.Router();

router.post("/signup", upload.single("image"), signup);
router.post("/login", login);

module.exports = router;