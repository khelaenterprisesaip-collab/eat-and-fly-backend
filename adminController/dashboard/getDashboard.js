const Invoice = require("../../models/Invoice.model");
const Product = require("../../models/Product.model");
const Category = require("../../models/Category.model");

const getDashboardStats = async (req, res) => {
  try {
    let { startDate, endDate, airport } = req.query;
    const now = new Date();
    // Default to this month
    const defaultStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();
    const defaultEnd = now.getTime();

    const currentStart = startDate ? parseInt(startDate) : defaultStart;
    const currentEnd = endDate ? parseInt(endDate) : defaultEnd;

    // Convert milliseconds to seconds if needed (database stores dateTime in seconds)
    const filterStart =
      currentStart > 10000000000
        ? Math.floor(currentStart / 1000)
        : currentStart;
    const filterEnd =
      currentEnd > 10000000000 ? Math.floor(currentEnd / 1000) : currentEnd;

    // Filter for Invoice aggregations
    console.log("filterStart, filterEnd", filterStart, filterEnd);
    const invoiceFilter = {
      dateTime: { $gte: filterStart, $lte: filterEnd },
    };

    // If airport filter is applied
    if (airport && airport !== "all") {
      invoiceFilter.airport = airport;
    }

    // 1. Run Parallel Aggregations for Performance
    const [
      summaryStats,
      chartData,
      topProducts,
      airportDistribution,
      paymentMethodDistribution,
      categoryDistribution,
      recentInvoices,
      productCounts,
    ] = await Promise.all([
      // A. Summary Stats: Total Revenue, Total Invoices, AOV
      Invoice.aggregate([
        { $match: invoiceFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalInvoices: { $sum: 1 },
            avgOrderValue: { $avg: "$totalAmount" },
          },
        },
      ]),

      // B. Revenue Chart: Daily Sales
      Invoice.aggregate([
        { $match: invoiceFilter },
        {
          $project: {
            // Convert seconds to milliseconds for $toDate
            dateObj: { $toDate: { $multiply: ["$dateTime", 1000] } },
            totalAmount: 1,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$dateObj" },
              month: { $month: "$dateObj" },
              day: { $dayOfMonth: "$dateObj" },
            },
            revenue: { $sum: "$totalAmount" },
            count: { $sum: 1 },
            date: { $first: "$dateObj" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),

      // C. Top Selling Products (by Quantity)
      Invoice.aggregate([
        { $match: invoiceFilter },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            quantity: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.quantity", "$items.perUnitPrice"] },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
      ]),

      // D. Revenue by Airport
      Invoice.aggregate([
        { $match: invoiceFilter },
        {
          $group: {
            _id: "$airport",
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),

      // E. Payment Method Breakdown
      Invoice.aggregate([
        { $match: invoiceFilter },
        { $unwind: "$payments" },
        {
          $group: {
            _id: "$payments.method",
            amount: { $sum: "$payments.amount" },
          },
        },
        { $sort: { amount: -1 } },
      ]),

      // F. Sales by Category
      // Note: This requires joining by product name.
      // Ensure "product" collection name matches Mongoose model registration.
      Invoice.aggregate([
        { $match: invoiceFilter },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "product",
            localField: "items.name",
            foreignField: "name",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        {
          $lookup: {
            from: "categories",
            localField: "productInfo.categoryId",
            foreignField: "uuid",
            as: "categoryInfo",
          },
        },
        { $unwind: "$categoryInfo" },
        {
          $group: {
            _id: "$categoryInfo.name",
            revenue: {
              $sum: { $multiply: ["$items.quantity", "$items.perUnitPrice"] },
            },
            quantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),

      // G. Recent Invoices
      Invoice.find(invoiceFilter)
        .sort({ dateTime: -1 })
        .limit(10)
        .select("invoiceNumber totalAmount airport dateTime status"),

      // H. Product Counts
      Product.countDocuments({ isAvailable: true }),
    ]);

    // Format results to be frontend-friendly
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: summaryStats[0]?.totalRevenue || 0,
          totalInvoices: summaryStats[0]?.totalInvoices || 0,
          avgOrderValue: summaryStats[0]?.avgOrderValue?.toFixed(2) || 0,
          activeProducts: productCounts || 0,
        },
        revenueChart: {
          labels: chartData.map((d) => {
            const dt = new Date(d.date);
            return `${dt.getDate()}/${dt.getMonth() + 1}`;
          }),
          series: chartData.map((d) => d.revenue),
        },
        topProducts: topProducts.map((p) => ({
          name: p._id,
          quantity: p.quantity,
          revenue: p.revenue,
        })),
        airportDistribution: airportDistribution.map((a) => ({
          airport: a._id || "Unknown",
          revenue: a.revenue,
        })),
        paymentDistribution: paymentMethodDistribution.map((p) => ({
          method: p._id,
          amount: p.amount,
        })),
        categoryDistribution: categoryDistribution.map((c) => ({
          category: c._id,
          revenue: c.revenue,
          quantity: c.quantity,
        })),
        recentInvoices: recentInvoices.map((inv) => ({
          id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          total: inv.totalAmount,
          airport: inv.airport,
          date: inv.dateTime * 1000,
          status: inv.status,
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard Remake Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = getDashboardStats;
