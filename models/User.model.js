const { Schema, model } = require("mongoose");

const UserSchema = new Schema(
  {
    uuid: {
      type: String,
      required: false,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    firstName: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      // required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "staff"],
      default: "staff",
    },
    airport: {
      type: String,
      required: true,
      enum: ["amritsar", "jalandhar", "ghaziabad", "jaisalmer", "ludhiana"],
    },
  },
  { timestamps: true }
);

const User = model("User", UserSchema, "user");

module.exports = User;
