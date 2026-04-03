const Invoice = require("../../models/Invoice.model");
const Product = require("../../models/Product.model");

const getDashboardStats = async (req, res) => {
  try {
    // 1. Get paymentMethod from query along with dates
    let { startDate, endDate, paymentMethod } = req.query;

    const now = new Date();
    const defaultStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime();
    const defaultEnd = now.getTime();

    const currentStart = startDate ? parseInt(startDate) : defaultStart;
    const currentEnd = endDate ? parseInt(endDate) : defaultEnd;

    // 2. Build Invoice Filter
    const currentInvoiceFilter = {
      dateTime: { $gte: currentStart, $lte: currentEnd },
    };

    // If paymentMethod is provided, add it to the filter
    if (paymentMethod) {
      currentInvoiceFilter.$or = [
        { "payments.method": paymentMethod },
        { paymentMethod: paymentMethod }
      ];
    }

    // Product Filter (Products don't usually have payment methods, so we keep this date-only)
    const currentObjFilter = {
      createdAt: {
        $gte: new Date(currentStart),
        $lte: new Date(currentEnd),
      },
    };

    // 3. Run Queries
    const [invoiceCount, productCount, salesAgg, chartData] = await Promise.all(
      [
        // A. Invoices Count (Filtered by Payment Method if present)
        Invoice.countDocuments(currentInvoiceFilter),

        // B. Products Count
        Product.countDocuments(currentObjFilter),

        // C. Sales (Total Revenue - Filtered by Payment Method)
        Invoice.aggregate([
          { $match: currentInvoiceFilter },
          ...(paymentMethod 
            ? [
                {
                  $project: {
                    matchedAmount: {
                      $cond: {
                        if: { $and: [{ $isArray: "$payments" }, { $gt: [{ $size: "$payments" }, 0] }] },
                        then: {
                          $reduce: {
                            input: {
                              $filter: {
                                input: "$payments",
                                as: "pay",
                                cond: { $eq: ["$$pay.method", paymentMethod] }
                              }
                            },
                            initialValue: 0,
                            in: { $add: ["$$value", "$$this.amount"] }
                          }
                        },
                        else: {
                          $cond: [ { $eq: ["$paymentMethod", paymentMethod] }, "$totalAmount", 0 ]
                        }
                      }
                    }
                  }
                },
                { $group: { _id: null, total: { $sum: "$matchedAmount" } } }
              ]
            : [
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
              ]
          )
        ]),

        // D. Chart Data (Filtered by Payment Method)
        Invoice.aggregate([
          { $match: currentInvoiceFilter },
          ...(paymentMethod
            ? [
                {
                  $project: {
                    dateObj: { $toDate: "$dateTime" },
                    amount: {
                      $cond: {
                        if: { $and: [{ $isArray: "$payments" }, { $gt: [{ $size: "$payments" }, 0] }] },
                        then: {
                          $reduce: {
                            input: {
                              $filter: {
                                input: "$payments",
                                as: "pay",
                                cond: { $eq: ["$$pay.method", paymentMethod] }
                              }
                            },
                            initialValue: 0,
                            in: { $add: ["$$value", "$$this.amount"] }
                          }
                        },
                        else: {
                          $cond: [ { $eq: ["$paymentMethod", paymentMethod] }, "$totalAmount", 0 ]
                        }
                      }
                    }
                  }
                }
              ]
            : [
                {
                  $project: {
                    amount: "$totalAmount",
                    dateObj: { $toDate: "$dateTime" },
                  },
                },
              ]),
          {
            $group: {
              _id: {
                year: { $year: "$dateObj" },
                month: { $month: "$dateObj" },
                day: { $dayOfMonth: "$dateObj" },
              },
              dateStr: { $first: "$dateObj" },
              revenue: { $sum: "$amount" },
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

    const chartCategories = chartData.map((d) => {
      const date = new Date(d.dateStr);
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
