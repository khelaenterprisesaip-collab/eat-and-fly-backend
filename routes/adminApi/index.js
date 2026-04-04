const router = require("express").Router();

//Admin APIS

const jwtValidation = require("../../middlewares/jwt_validation");

router.use("/user/admin", jwtValidation, require("./User.route"));
router.use("/dashboard", jwtValidation, require("./Dashboard.route"));

module.exports = router;
