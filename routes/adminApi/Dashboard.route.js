const router = require("express").Router();

// bring in models and controllers
const getDashboardStats = require("../../adminController/dashboard/getDashboard");

// get dashboard stats
router.get("/", getDashboardStats);

module.exports = router;
