const InvoiceModel = require("../../models/Invoice.model");
const ProductModel = require("../../models/Product.model");

const getDashboardSummary = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;

    const dateFilter = {};

    // If date filters are provided
    if (startDate || endDate) {
      dateFilter.createdAt = {};

      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        // Include full day for endDate
        dateFilter.createdAt.$lte = new Date(
          new Date(endDate).setHours(23, 59, 59, 999)
        );
      }
    }

    // Build invoice filter with date range
    const invoiceFilter = { ...dateFilter };

    // TOTAL INVOICES (filtered by createdAt)
    const totalInvoices = await InvoiceModel.countDocuments(invoiceFilter);

    // TOTAL REVENUE (sum of totalAmount)
    const totalAmountAgg = await InvoiceModel.aggregate([
      { $match: invoiceFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalAmount =
      totalAmountAgg.length > 0 ? totalAmountAgg[0].totalAmount : 0;

    // TOTAL PRODUCTS (optional – filtered by createdAt, or remove filter if not needed)
    const totalProducts = await ProductModel.countDocuments(dateFilter);

    // LATEST 10 INVOICES
    const latestInvoices = await InvoiceModel.find(invoiceFilter)
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      summary: {
        totalInvoices,
        totalAmount,
        totalProducts,
      },
      latestInvoices,
    });
  } catch (error) {
    console.log("Error fetching dashboard summary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = getDashboardSummary;
