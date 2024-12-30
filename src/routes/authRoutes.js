const express = require("express");
const { register, login, getAllUsers, getOneUser, updateUser, deleteUser, approveDriver, uploadLicenseImages } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/upload-license-images", uploadLicenseImages);
router.post("/approve-driver", approveDriver);


router.get("/users", getAllUsers);
router.get("/users/:id", getOneUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

module.exports = router;
