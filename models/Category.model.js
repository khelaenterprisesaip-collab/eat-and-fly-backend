const { Schema, model } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const CategorySchema = new Schema(
    {
        uuid: {
            type: String,
            unique: true,
            default: uuidv4,
        },
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            required: [true, "Category description is required"],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Category = model("Category", CategorySchema);

module.exports = Category;
