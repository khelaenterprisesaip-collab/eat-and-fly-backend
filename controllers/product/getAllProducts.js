const Product = require("../../models/Product.model"); // Adjust path as needed

/**
 * @desc    Get all products with filtering, searching, and pagination
 * @route   GET /api/products
 * @access  Public
 *
 * @query   ?airport=amritsar  (Filters by products available at a specific airport)
 * @query   ?search=paneer     (Case-insensitive search on name, description, itemCode)
 * @query   ?page=1            (Page number for pagination)
 * @query   ?limit=10          (Number of items per page)
 */
const getProducts = async (req, res, next) => {
  try {
    // --- 1. Destructure Query Params ---
    const { search, airport, page, limit } = req.query;

    // --- 2. Pagination Setup ---
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // --- 3. Build Mongoose Query Object ---
    let query = {};

    // a) Add search filter (if provided)
    if (search) {
      const regex = new RegExp(search, "i"); // 'i' for case-insensitive
      query.$or = [
        { name: regex },
        { description: regex },
        { itemCode: regex },
      ];
    }

    // b) Add airport filter (if provided)
    // This will find all products where the 'airport' string is
    // present inside the 'availableAtAirports' array.
    if (airport) {
      // Your schema validation already ensures that if an airport is in
      // 'availableAtAirports', it also has a corresponding 'pricing' entry.
      query.availableAtAirports = airport;
    }

    // --- 4. Execute Queries ---
    // We run two queries in parallel:
    // 1. Get the total count of documents that match the filter (for pagination)
    // 2. Get the actual paginated data
    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort({ createdAt: -1 }) // Sort by newest first (optional)
        .skip(skip)
        .limit(limitNum)
        .lean(), // .lean() for faster non-Mongoose-object results
    ]);

    // --- 5. Send Response ---
    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        totalProducts,
        totalPages: Math.ceil(totalProducts / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = getProducts;
