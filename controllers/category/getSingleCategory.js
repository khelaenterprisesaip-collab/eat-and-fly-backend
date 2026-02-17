const Category = require("../../models/Category.model");

const getSingleCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Try finding by UUID first, then by _id if it's a valid ObjectId
        let category = await Category.findOne({ uuid: id });

        if (!category && id.match(/^[0-9a-fA-F]{24}$/)) {
            category = await Category.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = getSingleCategory;
