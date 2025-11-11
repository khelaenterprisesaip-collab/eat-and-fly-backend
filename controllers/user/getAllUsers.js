const User = require("../../models/User.model");

const getAllUsers = async (req, res, next) => {
  try {
    let searchCriteria = {};
    const { startIndex, viewSize, email, firstName, airport, isActive } =
      req.query;

    if (email) {
      searchCriteria.email = { $regex: email, $options: "i" };
    }

    if (firstName) {
      const regex = { $regex: firstName, $options: "i" };
      searchCriteria.$or = [{ firstName: regex }, { lastName: regex }];
    }

    if (airport) {
      searchCriteria.airport = airport;
    }

    if (isActive !== undefined) {
      searchCriteria.isActive = isActive === "true";
    }

    const start = parseInt(startIndex || 0);
    const limit = parseInt(viewSize || 10);

    const data = await User.aggregate([
      {
        $match: searchCriteria,
      },
      {
        $match: {
          role: "staff",
        },
      },
      {
        $facet: {
          data: [
            {
              $sort: { createdAt: -1 },
            },
            {
              $skip: start,
            },
            {
              $limit: limit,
            },
          ],
          count: [{ $count: "count" }],
        },
      },
    ]);

    res.json({
      message: "Fetched successfully",
      data: data?.[0].data,
      count: data?.[0]?.count?.[0]?.count || 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = getAllUsers;
