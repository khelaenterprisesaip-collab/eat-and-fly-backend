const router = require("express").Router();

const cancelSubscription = require("../../adminController/user/cancelSubscription");
const createUser = require("../../adminController/user/createUser");
const getSingleUser = require("../../adminController/user/getSingleUser");
const updateUserStatus = require("../../adminController/user/updateUserStatus");
const exportUsers = require("../../adminController/user/exportUsers");
// bring in models and controllers

const roleCheck = require("../../middlewares/roleCheck");

const getAllUsers = require("../../adminController/user/getAllUsers");
const updateProfile = require("../../controllers/user/updateProfile");
const updateUserPassword = require("../../adminController/user/updateUserPassword");

// get user details
router.get(
  "/",
  (req, res, next) => roleCheck(req, res, next, ["admin"]),
  getAllUsers
);
router.get(
  "/export",
  (req, res, next) => roleCheck(req, res, next, ["admin"]),
  exportUsers
);
//this api will update the status (isActive) of the user  to false and vice versa,we are not deleting the user from the database
router.get("/:id", getSingleUser);
router.post("/add-user", createUser);
router.put("/:id", updateUserStatus);
router.put("/password/reset", updateUserPassword);
router.put("/:id/subscription", cancelSubscription);
router.put("/updateProfile/:id", updateProfile);

module.exports = router;
