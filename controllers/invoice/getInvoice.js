const InvoiceModel = require("../../models/Invoice.model");
const UserModel = require("../../models/User.model");

const getInvoices = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", airport = "" } = req.query;
    const currentUser = req.user;

    page = Number(page);
    limit = Number(limit);

    const query = {};

    if (search) {
      const regex = new RegExp(search, "i");

      query.$or = [{ invoiceNumber: regex }, { "customer.name": regex }];
    }

    if (currentUser?.role === "staff") {
      const existingUser = await UserModel.findOne({
        uuid: currentUser?.uuid,
      }).select("airport");

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!existingUser?.airport) {
        return res.status(403).json({
          success: false,
          message: "Airport is not assigned to current user",
        });
      }

      query.airport = "ludhiana";
    } else if (airport) {
      query.airport = airport.toLowerCase();
    }

    const skip = (page - 1) * limit;

    // Fetch results
    const [invoices, total] = await Promise.all([
      InvoiceModel.find(query)
        .sort({ createdAt: -1 }) // newest first
        .skip(skip)
        .limit(limit),

      InvoiceModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      invoices,
    });
  } catch (error) {
    console.log("Error fetching invoices:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getInvoices;
