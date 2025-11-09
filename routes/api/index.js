const router = require("express").Router();
// APIS

router.use("/auth", require("./Auth.route"));

const jwtValidation = require("../../middlewares/jwt_validation");

router.use("/me", jwtValidation, require("../../controllers/me/getMe"));
router.use(
  "/auth/admin/me",
  jwtValidation,
  require("../../controllers/me/getAdminMe")
);
router.use("/user", jwtValidation, require("./User.route"));
router.use("/product", jwtValidation, require("./Product.route"));

module.exports = router;
