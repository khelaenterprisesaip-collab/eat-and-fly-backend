const Invoice = require("../../models/Invoice.model");
const Product = require("../../models/Product.model");

const getDashboardStats = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;

    const now = new Date();
    const defaultStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime();
    const defaultEnd = now.getTime();

    const currentStart = startDate ? parseInt(startDate) : defaultStart;
    const currentEnd = endDate ? parseInt(endDate) : defaultEnd;

    // Duration is no longer needed for logic switching, but kept if you need it later
    // const duration = currentEnd - currentStart;

    const currentInvoiceFilter = {
      dateTime: { $gte: currentStart, $lte: currentEnd },
    };

    const currentObjFilter = {
      createdAt: {
        $gte: new Date(currentStart),
        $lte: new Date(currentEnd),
      },
    };

    const [invoiceCount, productCount, salesAgg, chartData] = await Promise.all(
      [
        Invoice.countDocuments(currentInvoiceFilter),
        Product.countDocuments(currentObjFilter),
        Invoice.aggregate([
          { $match: currentInvoiceFilter },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),

        // --- MODIFIED CHART AGGREGATION ---
        Invoice.aggregate([
          { $match: currentInvoiceFilter },
          {
            $project: {
              totalAmount: 1,
              dateObj: { $toDate: "$dateTime" },
            },
          },
          {
            $group: {
              _id: {
                // Always group by exact Day, Month, Year
                year: { $year: "$dateObj" },
                month: { $month: "$dateObj" },
                day: { $dayOfMonth: "$dateObj" },
              },
              dateStr: { $first: "$dateObj" },
              revenue: { $sum: "$totalAmount" },
            },
          },
          { $sort: { dateStr: 1 } },
        ]),
      ]
    );

    const totalRevenue = salesAgg[0]?.total || 0;

    const chartSeries = [
      {
        name: "Revenue",
        data: chartData.map((d) => d.revenue),
      },
    ];

    // --- MODIFIED FORMATTING ---
    const chartCategories = chartData.map((d) => {
      const date = new Date(d.dateStr);
      // Always format as DD/MM
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    res.status(200).json({
      success: true,
      data: {
        cards: {
          invoices: { value: invoiceCount },
          products: { value: productCount },
          sales: { value: totalRevenue },
        },
        chart: {
          series: chartSeries,
          categories: chartCategories,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = getDashboardStats;
