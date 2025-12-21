const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");

const statuses = {
  paid: "PAID",
  unpaid: "UNPAID",
  overdue: "OVERDUE",
};

const airportNames = {
  amritsar: "Sri Guru Ram Dass Ji International Airport (ATQ)",
  ghaziabad: "Hindon Airport (HDO)",
  jalandhar: "Adampur Airport (AIP)",
  jaisalmer: "Jaisalmer Airport (JSA)",
  ludhiana: "Ludhiana Airport (LUH)",
};
const airportCity = {
  amritsar: "Amritsar, Punjab 143001",
  ghaziabad: "Ghaziabad, Uttar Pradesh 201002",
  jalandhar: "Jalandhar, Punjab 144001",
  jaisalmer: "Jaisalmer, Rajasthan 345001",
  ludhiana: "Ludhiana, Punjab 141001",
};
// --- DESIGN CONSTANTS ---
const COLORS = {
  primary: "#1a237e", // Deep Navy Blue
  accent: "#2563eb", // Bright Blue
  textDark: "#1f2937", // Near Black
  textGray: "#6b7280", // Muted Gray
  textLight: "#9ca3af", // Light Gray
  tableHeader: "#f3f4f6", // Very Light Gray
  tableRowOdd: "#ffffff",
  tableRowEven: "#f9fafb", // Alternating row color
  border: "#e5e7eb",
  successBg: "#dcfce7",
  successText: "#166534",
  dangerBg: "#fee2e2",
  dangerText: "#991b1b",
};

const FONTS = {
  regular: "Helvetica",
  bold: "Helvetica-Bold",
};

/**
 * Generate Invoice PDF
 */
const generateInvoicePDF = async (invoiceData) => {
  // Data Preparation
  const invoice = {
    invoiceNumber: invoiceData?.invoiceNumber || "-",
    dateTime: dayjs.unix(invoiceData?.dateTime).format("MMM DD, YYYY"),
    time: dayjs.unix(invoiceData?.dateTime).format("hh:mm A"),
    status: statuses[invoiceData?.status] || "PAID",
    company: {
      name: "Eat & Fly",
      address:
        airportNames[invoiceData?.airport] ||
        "Sri Guru Ram Dass Ji International Airport (ATQ)",
      city: airportCity[invoiceData?.airport] || "Amritsar, Punjab 143001",
      email: "info@khelaenterprises.com",
      logoPath: path.join(__dirname, "../assets/logo.jpeg"),
    },
    items: invoiceData?.items || [],
    subTotal: invoiceData?.subTotal || 0,
    taxPercentage: 5,
    totalAmount: invoiceData?.totalAmount || 0,
  };

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40, // Slightly tighter margins for a modern look
        bufferPages: true,
      });

      const invoicesDir = path.join(__dirname, "../uploads/invoices");
      if (!fs.existsSync(invoicesDir))
        fs.mkdirSync(invoicesDir, { recursive: true });

      const filePath = path.join(invoicesDir, `${invoice.invoiceNumber}.pdf`);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- HELPER FUNCTIONS ---
      const formatCurrency = (amount) => `₹ ${amount.toFixed(2)}`;

      const drawHr = (y) => {
        doc
          .strokeColor(COLORS.border)
          .lineWidth(1)
          .moveTo(40, y)
          .lineTo(555, y)
          .stroke();
      };

      // ================= HEADER SECTION =================
      let y = 40;

      // 1. Logo (Top Left)
      if (fs.existsSync(invoice.company.logoPath)) {
        doc.image(invoice.company.logoPath, 40, y, { width: 60 });
      } else {
        // Fallback Logo Placeholder
        doc
          .roundedRect(40, y, 60, 60, 5)
          .fill(COLORS.primary)
          .fillColor("#FFF")
          .fontSize(20)
          .text("E&F", 50, y + 20);
      }

      // 2. Company Details (Left, below Logo)
      doc
        .fillColor(COLORS.textDark)
        .font(FONTS.bold)
        .fontSize(16)
        .text(invoice.company.name, 115, y + 10);

      doc
        .fillColor(COLORS.textGray)
        .font(FONTS.regular)
        .fontSize(9)
        .text(invoice.company.email, 115, y + 32);

      // 3. Invoice Meta (Top Right)
      doc
        .fillColor(COLORS.textLight)
        .fontSize(10)
        .font(FONTS.bold)
        .text("INVOICE NUMBER", 300, y, { align: "right" });

      doc
        .fillColor(COLORS.textDark)
        .fontSize(14)
        .text(`# ${invoice.invoiceNumber}`, 300, y + 15, { align: "right" });

      // Status Badge (Top Right, below invoice num)
      const badgeWidth = 80;
      const badgeHeight = 20;
      const badgeX = 555 - badgeWidth; // Align right margin
      const badgeY = y + 40;
      const isPaid = invoice.status === "PAID";

      doc
        .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 10)
        .fill(isPaid ? COLORS.successBg : COLORS.dangerBg);

      doc
        .fillColor(isPaid ? COLORS.successText : COLORS.dangerText)
        .fontSize(9)
        .font(FONTS.bold)
        .text(invoice.status, badgeX, badgeY + 5, {
          width: badgeWidth,
          align: "center",
        });

      // ================= INFO GRID =================
      y = 130;
      drawHr(y);
      y += 20;

      // Column 1: Location / Branch
      doc
        .fillColor(COLORS.textLight)
        .fontSize(9)
        .font(FONTS.bold)
        .text("LOCATION / BRANCH", 40, y);

      doc
        .fillColor(COLORS.textDark)
        .fontSize(10)
        .font(FONTS.regular)
        .text(invoice.company.address, 40, y + 15, { width: 200 })
        .text(invoice.company.city, 40, doc.y);

      // Column 2: Date
      doc
        .fillColor(COLORS.textLight)
        .fontSize(9)
        .font(FONTS.bold)
        .text("DATE ISSUED", 300, y);

      doc
        .fillColor(COLORS.textDark)
        .fontSize(10)
        .font(FONTS.regular)
        .text(invoice.dateTime, 300, y + 15)
        .text(invoice.time, 300, doc.y);

      // Column 3: Total Amount (Highlighted)
      doc
        .fillColor(COLORS.textLight)
        .fontSize(9)
        .font(FONTS.bold)
        .text("TOTAL AMOUNT", 450, y);

      doc
        .fillColor(COLORS.primary)
        .fontSize(18)
        .font(FONTS.bold)
        .text(formatCurrency(invoice.totalAmount), 450, y + 15);

      // ================= ITEM TABLE =================
      y = 230;

      // Layout columns
      const cols = {
        desc: { x: 40, w: 260 },
        qty: { x: 300, w: 60 }, // Center aligned
        price: { x: 380, w: 80 }, // Right aligned
        total: { x: 480, w: 75 }, // Right aligned
      };

      // Table Header Background
      doc.rect(40, y, 515, 30).fill(COLORS.tableHeader);

      // Table Header Text
      doc.fillColor(COLORS.textDark).fontSize(9).font(FONTS.bold);
      doc.text("DESCRIPTION", cols.desc.x + 10, y + 10);
      doc.text("QTY", cols.qty.x, y + 10, {
        width: cols.qty.w,
        align: "center",
      });
      doc.text("PRICE", cols.price.x, y + 10, {
        width: cols.price.w,
        align: "right",
      });
      doc.text("TOTAL", cols.total.x, y + 10, {
        width: cols.total.w,
        align: "right",
      });

      y += 30; // Move below header

      // Table Rows
      invoice.items.forEach((item, i) => {
        const rowHeight = 35;
        const currentY = y;

        // Zebra Striping (Even rows get background)
        if (i % 2 === 0) {
          doc.rect(40, currentY, 515, rowHeight).fill(COLORS.tableRowEven);
        }

        // Check for page break
        if (currentY > 750) {
          doc.addPage();
          y = 40; // Reset Y
        }

        // Draw Text
        doc.fillColor(COLORS.textDark).fontSize(10).font(FONTS.regular);

        // Item Name
        doc.text(item.name, cols.desc.x + 10, currentY + 11, {
          width: cols.desc.w,
        });

        // Qty
        doc.text(item.quantity.toString(), cols.qty.x, currentY + 11, {
          width: cols.qty.w,
          align: "center",
        });

        // Price
        doc.text(
          formatCurrency(item.perUnitPrice),
          cols.price.x,
          currentY + 11,
          {
            width: cols.price.w,
            align: "right",
          }
        );

        // Total (Bold)
        doc.font(FONTS.bold);
        doc.text(formatCurrency(item.totalPrice), cols.total.x, currentY + 11, {
          width: cols.total.w,
          align: "right",
        });

        y += rowHeight;
      });

      // ================= SUMMARY / TOTALS =================
      y += 20;

      const summaryX = 350;
      const valX = 480;
      const valW = 75;

      // Helper for summary rows
      const drawSummaryRow = (
        label,
        value,
        isBold = false,
        isTotal = false
      ) => {
        const labelColor = isTotal ? COLORS.primary : COLORS.textGray;
        const valueColor = isTotal ? COLORS.primary : COLORS.textDark;
        const fontSize = isTotal ? 12 : 10;
        const fontType = isTotal || isBold ? FONTS.bold : FONTS.regular;

        doc
          .fillColor(labelColor)
          .font(fontType)
          .fontSize(fontSize)
          .text(label, summaryX, y);

        doc
          .fillColor(valueColor)
          .font(fontType)
          .fontSize(fontSize)
          .text(value, valX, y, { width: valW, align: "right" });

        y += isTotal ? 25 : 20;
      };

      // Subtotal
      drawSummaryRow("Subtotal", formatCurrency(invoice.subTotal));

      // Tax
      drawSummaryRow(
        `Tax (${invoice.taxPercentage}%)`,
        formatCurrency((invoice.subTotal * invoice.taxPercentage) / 100)
      );

      // Divider
      doc
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .moveTo(summaryX, y - 5)
        .lineTo(555, y - 5)
        .stroke();
      y += 5;

      // Grand Total
      drawSummaryRow(
        "TOTAL DUE",
        formatCurrency(invoice.totalAmount),
        true,
        true
      );

      // ================= FOOTER =================
      // Push footer to bottom
      const footerY = 730;

      doc
        .rect(0, footerY, 595, 112) // Fill bottom with light color
        .fill(COLORS.tableHeader);

      doc
        .fillColor(COLORS.primary)
        .font(FONTS.bold)
        .fontSize(12)
        .text("Thank you for your business!", 40, footerY + 25, {
          align: "center",
        });

      doc
        .fillColor(COLORS.textGray)
        .font(FONTS.regular)
        .fontSize(9)
        .text(
          "Please include the invoice number in your payment reference.",
          40,
          footerY + 45,
          {
            align: "center",
          }
        );

      doc
        .fillColor(COLORS.textLight)
        .fontSize(8)
        .text(
          `Generated on ${dayjs().format("DD MMM YYYY HH:mm")}`,
          40,
          footerY + 70,
          { align: "center" }
        );

      doc.end();

      stream.on("finish", () => resolve({ filePath }));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
