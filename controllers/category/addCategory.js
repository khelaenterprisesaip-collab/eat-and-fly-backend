const Category = require("../../models/Category.model");

const addCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const category = await Category.create({ name, description });

        res.status(201).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = addCategory;
