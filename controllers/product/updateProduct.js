const Product = require("../../models/Product.model");

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:uuid
 * @access  Private (Admin)
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id: uuid } = req.params;
    const updateData = req.body;

    const product = await Product.findOne({ uuid });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (updateData.itemCode) {
      const existingProduct = await Product.findOne({
        itemCode: updateData.itemCode.toUpperCase(),
        uuid: { $ne: uuid },
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Another product with this item code already exists",
        });
      }
    }

    Object.assign(product, updateData);

    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    next(error);
  }
};

module.exports = updateProduct;
