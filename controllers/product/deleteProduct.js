const Product = require("../../models/Product.model");

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id: uuid } = req.params;

    const deletedProduct = await Product.findOneAndDelete({ uuid });

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: deletedProduct,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = deleteProduct;
