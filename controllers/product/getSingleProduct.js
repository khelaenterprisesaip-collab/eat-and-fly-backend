const Product = require("../../models/Product.model"); // Adjust path as needed

/**
 * @desc    Get a single product by its ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    const productUuid = req.params.id;

    const product = await Product.findOne({ uuid: productUuid }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = getProductById;
