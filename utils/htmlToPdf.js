const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");

// --- DATA MAPPING ---
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
  primary: "#1e293b", // Slate 800
  accent: "#2563eb", // Royal Blue
  textDark: "#111827", // Black-ish
  textGray: "#6b7280", // Gray
  border: "#e5e7eb", // Light Gray
  tableHeader: "#f3f4f6", // Header Gray
  tableRowEven: "#f9fafb", // Very light gray
  highlight: "#f8fafc", // Summary box bg
  success: "#16a34a", // Green
  danger: "#dc2626", // Red
};

const FONTS = {
  regular: "Helvetica",
  bold: "Helvetica-Bold",
};

const generateInvoicePDF = async (invoiceData) => {
  // Safe Data Mapping
  const invoice = {
    invoiceNumber: invoiceData?.invoiceNumber || "-",
    date: dayjs.unix(invoiceData?.dateTime).format("DD MMM YYYY"),
    time: dayjs.unix(invoiceData?.dateTime).format("hh:mm A"),
    status: statuses[invoiceData?.status] || "PAID",
    branchName: airportNames[invoiceData?.airport] || "Main Branch",
    branchAddress: airportCity[invoiceData?.airport] || "",
    // Company Details
    company: {
      name: "Eat & Fly",
      email: "info@khelaenterprises.com",
      phone: "+91 88721 94747",
      logoPath: path.join(__dirname, "../assets/logo.jpeg"),
    },
    items: invoiceData?.items || [],
    subTotal: invoiceData?.subTotal || 0,
    cgstPercentage: invoiceData?.cgstPercentage || 0,
    igstPercentage: invoiceData?.igstPercentage || 0,
    discountPercentage: invoiceData?.discountPercentage || 0,
    discount: invoiceData?.discount || 0,
    totalAmount: invoiceData?.totalAmount || 0,
  };

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });

      const invoicesDir = path.join(__dirname, "../uploads/invoices");
      if (!fs.existsSync(invoicesDir))
        fs.mkdirSync(invoicesDir, { recursive: true });

      const filePath = path.join(invoicesDir, `${invoice.invoiceNumber}.pdf`);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- HELPERS ---
      const formatCurrency = (amount) => `Rs. ${Number(amount).toFixed(2)}`;

      const drawHr = (y) => {
        doc
          .strokeColor(COLORS.border)
          .lineWidth(1)
          .moveTo(50, y)
          .lineTo(545, y)
          .stroke();
      };

      // ==========================================
      // 1. HEADER SECTION
      // ==========================================
      let y = 50;
      const logoSize = 60;
      const textLeftMargin = 120; // X position for text next to logo

      // -- Logo Logic --
      if (fs.existsSync(invoice.company.logoPath)) {
        doc.image(invoice.company.logoPath, 50, y, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize],
        });
      } else {
        // Fallback if logo missing
        doc.roundedRect(50, y, logoSize, logoSize, 5).fill(COLORS.primary);
        doc
          .fillColor("#FFF")
          .fontSize(16)
          .text("E&F", 65, y + 20);
      }

      // -- Company Details (Next to Logo) --
      doc
        .fillColor(COLORS.primary)
        .font(FONTS.bold)
        .fontSize(20)
        .text(invoice.company.name, textLeftMargin, y + 5);

      doc
        .fontSize(9)
        .font(FONTS.regular)
        .fillColor(COLORS.textGray)
        .text(invoice.company.email, textLeftMargin, y + 30)
        .text(invoice.company.phone, textLeftMargin, y + 42); // <--- Display Phone

      // -- Invoice Details (Right Side) --
      const rightColX = 400;

      doc
        .fontSize(10)
        .font(FONTS.bold)
        .fillColor(COLORS.textDark)
        .text("INVOICE", rightColX, y, { align: "right" });

      doc
        .fontSize(14)
        .fillColor(COLORS.accent)
        .text(`# ${invoice.invoiceNumber}`, rightColX, y + 15, {
          align: "right",
        });

      doc
        .fontSize(10)
        .fillColor(COLORS.textDark)
        .font(FONTS.regular)
        .text(`Date: ${invoice.date}`, rightColX, y + 35, { align: "right" })
        .text(`Time: ${invoice.time}`, rightColX, y + 48, { align: "right" });

      // -- Status Badge --
      const statusColor =
        invoice.status === "PAID" ? COLORS.success : COLORS.danger;
      doc.rect(475, y + 65, 70, 20).fillAndStroke(statusColor, statusColor);
      doc
        .fillColor("white")
        .fontSize(10)
        .font(FONTS.bold)
        .text(invoice.status, 475, y + 70, { width: 70, align: "center" });

      // ==========================================
      // 2. BILLING INFO (Location)
      // ==========================================
      y = 140;
      drawHr(y);
      y += 15;

      doc
        .fillColor(COLORS.textGray)
        .fontSize(9)
        .font(FONTS.bold)
        .text("ISSUED AT (BRANCH)", 50, y);

      doc
        .fillColor(COLORS.textDark)
        .fontSize(11)
        .font(FONTS.bold)
        .text(invoice.branchName, 50, y + 15)
        .font(FONTS.regular)
        .fontSize(10)
        .text(invoice.branchAddress, 50, y + 30, { width: 300 });

      // ==========================================
      // 3. TABLE HEADERS
      // ==========================================
      y += 60;
      const tableTop = y;

      const colItem = 50;
      const colQty = 320;
      const colPrice = 390;
      const colTotal = 470;
      const colTotalWidth = 75;

      // Header Background
      doc.rect(50, tableTop, 495, 25).fill(COLORS.tableHeader);

      doc.fillColor(COLORS.textDark).fontSize(9).font(FONTS.bold);
      doc.text("ITEM DESCRIPTION", colItem + 10, tableTop + 8);
      doc.text("QTY", colQty, tableTop + 8, { align: "center", width: 40 });
      doc.text("RATE", colPrice, tableTop + 8, { align: "right", width: 60 });
      doc.text("AMOUNT", colTotal, tableTop + 8, {
        align: "right",
        width: colTotalWidth,
      });

      // ==========================================
      // 4. TABLE ITEMS
      // ==========================================
      y += 25;
      doc.font(FONTS.regular).fontSize(10);

      invoice.items.forEach((item, i) => {
        const rowHeight = 30;

        if (i % 2 === 0) {
          doc.rect(50, y, 495, rowHeight).fill(COLORS.tableRowEven);
        }

        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc.fillColor(COLORS.textDark);
        doc.text(item.name, colItem + 10, y + 10);
        doc.text(item.quantity, colQty, y + 10, { align: "center", width: 40 });
        doc.text(formatCurrency(item.perUnitPrice), colPrice, y + 10, {
          align: "right",
          width: 60,
        });
        doc.font(FONTS.bold);
        doc.text(formatCurrency(item.totalPrice), colTotal, y + 10, {
          align: "right",
          width: colTotalWidth,
        });
        doc.font(FONTS.regular);

        y += rowHeight;
      });

      // ==========================================
      // 5. SUMMARY SECTION
      // ==========================================
      y += 20;

      const boxTop = y;
      const boxHeight = 160;
      doc.rect(300, boxTop, 245, boxHeight).fill(COLORS.highlight);

      let summaryY = boxTop + 15;
      const labelX = 320;
      const valX = 470;
      const valW = 60;

      const printSummaryRow = (label, value, isBold = false, isBig = false) => {
        doc
          .fillColor(isBig ? COLORS.primary : COLORS.textDark)
          .font(isBold || isBig ? FONTS.bold : FONTS.regular)
          .fontSize(isBig ? 12 : 10)
          .text(label, labelX, summaryY);

        doc.text(value, valX, summaryY, { align: "right", width: valW });
        summaryY += isBig ? 25 : 20;
      };

      printSummaryRow("Subtotal", formatCurrency(invoice.subTotal));

      if (invoice.discount > 0) {
        doc.fillColor(COLORS.danger);
        printSummaryRow(
          `Discount (${invoice.discountPercentage}%)`,
          `- ${formatCurrency(invoice.discount)}`
        );
        doc.fillColor(COLORS.textDark);
      }

      const taxableAmount = invoice.subTotal - invoice.discount;

      if (invoice.cgstPercentage > 0) {
        const cgstAmount = (
          taxableAmount *
          (invoice.cgstPercentage / 100)
        ).toFixed(2);
        printSummaryRow(
          `CGST (${invoice.cgstPercentage}%)`,
          formatCurrency(cgstAmount)
        );
      }

      if (invoice.igstPercentage > 0) {
        const igstAmount = (
          taxableAmount *
          (invoice.igstPercentage / 100)
        ).toFixed(2);
        printSummaryRow(
          `IGST (${invoice.igstPercentage}%)`,
          formatCurrency(igstAmount)
        );
      }

      doc
        .strokeColor(COLORS.border)
        .moveTo(315, summaryY)
        .lineTo(535, summaryY)
        .stroke();
      summaryY += 10;

      printSummaryRow(
        "Grand Total",
        formatCurrency(invoice.totalAmount),
        true,
        true
      );

      // ==========================================
      // 6. FOOTER
      // ==========================================
      const footerY = 760;
      drawHr(footerY - 10);

      doc
        .fontSize(8)
        .fillColor(COLORS.textLight)
        .text(
          "Thank you for your business. For any queries, contact support.",
          50,
          footerY,
          { align: "center", width: 495 }
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
