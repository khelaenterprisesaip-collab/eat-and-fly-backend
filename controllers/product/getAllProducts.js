const Product = require("../../models/Product.model");

const getProducts = async (req, res, next) => {
  try {
    const { name, description, itemCode, pricing, airport, page, limit } =
      req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    if (description) {
      query.description = { $regex: description, $options: "i" };
    }

    if (itemCode) {
      query.itemCode = { $regex: itemCode, $options: "i" };
    }

    if (airport) {
      query.availableAtAirports = airport;
    }

    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

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
