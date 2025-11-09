const User = require("../../models/User.model");

/**
 * Login for existing users
 *
 * @author Areeb
 * @since 8 Jul 2023
 */
const getAllUsers = async (req, res, next) => {
  try {
    let searchCriteria = {};
    const { startIndex, viewSize, keyword, isActive } = req.query;
    if (keyword) {
      searchCriteria = {
        ...searchCriteria,
        $or: [
          {
            firstName: {
              $regex: keyword,
              $options: "i",
            },
          },
          {
            email: {
              $regex: keyword,
              $options: "i",
            },
          },
        ],
      };
    }

    if (isActive) {
      searchCriteria = {
        ...searchCriteria,
        isActive: isActive === "true",
      };
    }
    const data = await User.aggregate([
      {
        $match: {
          ...searchCriteria,
          role: "staff",
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          data: [{ $skip: +startIndex || 0 }, { $limit: +viewSize || 10 }],
          count: [
            {
              $count: "total",
            },
          ],
        },
      },
    ]);

    res.json({
      message: "Fetched successfully",
      data: data?.[0]?.data,
      totalDocs: data?.[0]?.count?.[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = getAllUsers;
