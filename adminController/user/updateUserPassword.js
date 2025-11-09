const UserLoginMech = require("../../models/UserLoginMech.model");
const { hashPassword } = require("../../helpers/bcrypt");
const User = require("../../models/User.model");

/**
 * @desc    Admin updates a user's password
 * @route   PUT /api/admin/users/update-password
 * @access  Private Gurpreet
 */
const updateUserPassword = async (req, res, next) => {
  try {
    const { userUuid, newPassword } = req.body;

    console.log("ssddsd", req.body);
    console.log("userUuid", userUuid);
    // 1. Validate input
    if (!userUuid || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "User UUID and new password are required",
      });
    }

    // 2. Find the user's login mechanism document
    const user = await User.findOne({ uuid: userUuid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // 3. Hash the new password
    const hash = await hashPassword(newPassword);

    // 4. Update the password and save
    user.password = hash;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = updateUserPassword;
