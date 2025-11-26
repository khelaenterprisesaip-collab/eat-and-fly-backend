const router = require("express").Router();

// bring in models and controllers
const getAllUsers = require("../../controllers/user/getAllUsers");
const updateProfile = require("../../controllers/user/updateProfile");
const resetPassword = require("../../controllers/user/resetPassword");

const roleCheck = require("../../middlewares/roleCheck");
const getDashboardSummary = require("../../controllers/user/getDashboardSummary");

router.put("/updateProfile", updateProfile);
router.put("/password/:token", resetPassword);
router.get("/summary", getDashboardSummary);

router.get(
  "/",
  (req, res, next) => roleCheck(req, res, next, ["admin"]),
  getAllUsers
);

module.exports = router;
