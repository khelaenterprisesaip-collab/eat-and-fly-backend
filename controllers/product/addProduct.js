const Product = require("../../models/Product.model"); // Adjust path as needed

/**
 * @desc    Create a new product (item)
 * @route   POST /api/products
 * @access  Private (Admin)
 */
const addProduct = async (req, res, next) => {
  try {
    // 1. Destructure the new 'pricing' array and remove old 'price'
    const {
      name,
      description,
      pricing, // <-- Changed from 'price'
      availableAtAirports,
      isAvailable,
      imageUrl,
      itemCode,
    } = req.body;

    // 2. Validate that 'pricing' is provided and is an array
    if (!pricing || !Array.isArray(pricing) || pricing.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Pricing array is required and cannot be empty.",
      });
    }

    // 3. Check for duplicate itemCode (this is still good)
    if (itemCode) {
      const existingProduct = await Product.findOne({
        itemCode: itemCode.toUpperCase(),
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Product with this item code already exists",
        });
      }
    }

    // 4. Create new product with the new 'pricing' field
    const product = new Product({
      name,
      description,
      pricing,
      availableAtAirports,
      isAvailable,
      imageUrl,
      itemCode,
      // 'uuid' will be generated automatically by the schema default
    });

    // 5. Save to database
    // The 'pre-save' hook in your schema will automatically run here
    // to validate 'availableAtAirports' against 'pricing'.
    const newProduct = await product.save();

    res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    // This will catch Mongoose validation errors (like from the pre-save hook)
    next(error);
  }
};

module.exports = addProduct;

// example payload
// {
//   "name": "Paneer Tikka",
//   "description": "Grilled cottage cheese cubes.",
//   "availableAtAirports": ["amritsar", "ludhiana"],
//   "pricing": [
//     { "airport": "amritsar", "price": 250 },
//     { "airport": "ludhiana", "price": 260 }
//   ],
//   "isAvailable": true,
//   "itemCode": "A-102"
// }
