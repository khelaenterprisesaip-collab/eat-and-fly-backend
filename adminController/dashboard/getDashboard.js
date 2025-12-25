const Invoice = require("../../models/Invoice.model");
const Product = require("../../models/Product.model");
const User = require("../../models/User.model");

const AIRPORT_LIST = [
  "amritsar",
  "jalandhar",
  "ghaziabad",
  "jaisalmer",
  "ludhiana",
];

const getDashboardStats = async (req, res) => {
  try {
    // 1. Parse Dates from Query (Default to Current Month if missing)
    let { startDate, endDate } = req.query;

    const now = new Date();
    // Default: Start of current month to Now
    const defaultStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime();
    const defaultEnd = now.getTime();

    // Parse inputs (Frontend should send timestamps in milliseconds)
    const currentStart = startDate ? parseInt(startDate) : defaultStart;
    const currentEnd = endDate ? parseInt(endDate) : defaultEnd;

    // 2. Calculate "Previous Period" for comparison
    // Logic: If user filters for 10 days, compare with the 10 days before that.
    const duration = currentEnd - currentStart;
    const previousStart = currentStart - duration;
    const previousEnd = currentStart;

    // 3. Define Query Filters
    // Invoice uses 'dateTime' (Number/Unix)
    const currentInvoiceFilter = {
      dateTime: { $gte: currentStart, $lte: currentEnd },
    };
    const prevInvoiceFilter = {
      dateTime: { $gte: previousStart, $lt: previousEnd },
    };

    // Product/User use 'createdAt' (Date Object) - Convert Unix to Date
    const currentObjFilter = {
      createdAt: {
        $gte: new Date(currentStart),
        $lte: new Date(currentEnd),
      },
    };
    const prevObjFilter = {
      createdAt: {
        $gte: new Date(previousStart),
        $lt: new Date(previousEnd),
      },
    };

    // 4. Run Queries in Parallel
    const [
      currInvoicesCount,
      prevInvoicesCount,
      currProductsCount,
      prevProductsCount,
      currStaffCount,
      prevStaffCount,
      currSalesAgg,
      prevSalesAgg,
      chartData,
    ] = await Promise.all([
      // A. Invoices
      Invoice.countDocuments(currentInvoiceFilter),
      Invoice.countDocuments(prevInvoiceFilter),

      // B. Products (Newly added in this period)
      Product.countDocuments(currentObjFilter),
      Product.countDocuments(prevObjFilter),

      // C. Staff (Newly joined in this period)
      User.countDocuments(currentObjFilter),
      User.countDocuments(prevObjFilter),

      // D. Sales (Total Revenue)
      Invoice.aggregate([
        { $match: currentInvoiceFilter },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Invoice.aggregate([
        { $match: prevInvoiceFilter },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),

      // E. Chart Data (Dynamic Grouping)
      Invoice.aggregate([
        { $match: currentInvoiceFilter },
        {
          $project: {
            totalAmount: 1,
            // Convert Unix number to Date object for grouping
            dateObj: { $toDate: "$dateTime" },
          },
        },
        {
          $group: {
            _id: {
              // If range > 90 days, group by Month, else group by Day
              year: { $year: "$dateObj" },
              period:
                duration > 7776000000 // ~90 days in ms
                  ? { $month: "$dateObj" } // Group by Month
                  : { $dayOfYear: "$dateObj" }, // Group by Day
            },
            // Capture specific date for formatting later
            dateStr: { $first: "$dateObj" },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { dateStr: 1 } }, // Sort chronologically
      ]),
    ]);

    // 5. Calculate Values
    const currentSales = currSalesAgg[0]?.total || 0;
    const lastSales = prevSalesAgg[0]?.total || 0;

    // Percentage Change Helper
    const calculateChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    // 6. Format Chart Response
    const chartSeries = [
      {
        name: "Revenue",
        data: chartData.map((d) => d.revenue),
      },
    ];

    const chartCategories = chartData.map((d) => {
      const date = new Date(d.dateStr);
      // If grouping by month (long range), return Month name
      if (duration > 7776000000) {
        return date.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
      }
      // If grouping by day (short range), return DD/MM
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    res.status(200).json({
      success: true,
      data: {
        meta: {
          start: new Date(currentStart),
          end: new Date(currentEnd),
          durationDays: Math.round(duration / (1000 * 60 * 60 * 24)),
        },
        cards: {
          invoices: {
            value: currInvoicesCount,
            change: `${calculateChange(
              currInvoicesCount,
              prevInvoicesCount
            ).toFixed(1)}%`,
            changeType:
              currInvoicesCount >= prevInvoicesCount ? "positive" : "negative",
          },
          products: {
            // Note: This returns products CREATED in this period.
            // If you want absolute total inventory regardless of filter, remove the filter here.
            value: currProductsCount,
            change: `${calculateChange(
              currProductsCount,
              prevProductsCount
            ).toFixed(1)}%`,
            changeType:
              currProductsCount >= prevProductsCount ? "positive" : "negative",
          },
          staff: {
            value: currStaffCount,
            change: `${calculateChange(currStaffCount, prevStaffCount).toFixed(
              1
            )}%`,
            changeType:
              currStaffCount >= prevStaffCount ? "positive" : "negative",
          },
          airports: {
            value: AIRPORT_LIST.length,
            list: AIRPORT_LIST,
            change: "Fixed",
            changeType: "neutral",
          },
          sales: {
            value: currentSales,
            change: `${calculateChange(currentSales, lastSales).toFixed(1)}%`,
            changeType: currentSales >= lastSales ? "positive" : "negative",
          },
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
