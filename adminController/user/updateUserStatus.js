const User = require("../../models/User.model");

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const user = await User.findOne({ uuid: id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = updateUserStatus;
