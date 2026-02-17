const Category = require("../../models/Category.model");

const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await Category.findOneAndDelete({ uuid: id });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

module.exports = deleteCategory;
