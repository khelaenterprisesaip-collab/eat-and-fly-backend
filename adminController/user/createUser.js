const { v4: uuid } = require("uuid");
const UserLoginMech = require("../../models/UserLoginMech.model");
const User = require("../../models/User.model");
const { hashPassword } = require("../../helpers/bcrypt");

const createUser = async (req, res, next) => {
  try {
    let { firstName, lastName, email, password, airport } = req.body;

    email = email.trim().toLowerCase();

    const findUser = await User.findOne({
      email,
    });
    if (findUser) {
      throw new Error("User already exists");
    }
    const hash = await hashPassword(password);
    const user = new User({
      uuid: uuid(),
      firstName,
      lastName,
      email,
      password: hash,
      airport,
    });

    const userLoginMech = new UserLoginMech({
      user: user?.uuid,
      password: hash,
    });

    user.isActive = true;
    await userLoginMech.save();
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = createUser;
