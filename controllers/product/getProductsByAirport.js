const Product = require("../../models/Product.model");

const getProductsByAirport = async (req, res, next) => {
  try {
    const { name, description, itemCode, airport, page, limit } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};

    if (name) {
      matchStage.name = { $regex: name, $options: "i" };
    }

    if (description) {
      matchStage.description = { $regex: description, $options: "i" };
    }

    if (itemCode) {
      matchStage.itemCode = { $regex: itemCode, $options: "i" };
    }

    if (airport) {
      matchStage.availableAtAirports = airport;
    }

    const pipeline = [
      { $match: matchStage },

      // Filter pricing array to only requested airport
      {
        $addFields: {
          pricing: {
            $filter: {
              input: "$pricing",
              as: "price",
              cond: { $eq: ["$$price.airport", airport] },
            },
          },
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
    ];

    const [products, totalProducts] = await Promise.all([
      Product.aggregate(pipeline),
      Product.countDocuments(matchStage),
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

module.exports = getProductsByAirport;
