const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generate Invoice PDF
 * @param {Object} invoice
 * @returns {Promise<{filePath: string}>}
 */

const generateInvoicePDF = async (invoiceData) => {
  console.log("invoiceData", invoiceData);
  const invoice = {
    invoiceNumber: "INV-2025-0012",
    dateTime: Math.floor(Date.now() / 1000),
    dueDate: Math.floor(Date.now() / 1000) + 86400 * 7,
    status: "paid",
    company: {
      name: "Eat & Fly",
      address: "Sri Guru Ram Dass Ji International Airport",
      city: "Amritsar, Punjab 143001",
      email: "info@khelaenterprises.com",
      logoPath: path.join(__dirname, "../assets/logo.png"),
    },
    items: [
      {
        name: "Airport Pickup Service (DEL)",
        quantity: 1,
        perUnitPrice: 2500,
        totalPrice: 2500,
      },
      {
        name: "Extra Luggage Handling",
        quantity: 2,
        perUnitPrice: 300,
        totalPrice: 600,
      },
      {
        name: "Night Charges",
        quantity: 1,
        perUnitPrice: 400,
        totalPrice: 400,
      },
    ],
    subTotal: 3500,
    taxPercentage: 18,
    totalAmount: 4130,
    // comment:
    //   "Thank you for your business. Please quote invoice number in all payments.",
  };

  return new Promise((resolve, reject) => {
    try {
      // 2. Setup Document with cleaner margins
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

      // --- STYLE CONSTANTS ---
      const colors = {
        primary: "#2563EB", // Professional Blue
        secondary: "#64748B", // Slate Grey
        text: "#1E293B", // Dark Slate (not pure black)
        background: "#F1F5F9", // Light Grey for headers
        divider: "#E2E8F0", // Light border
      };

      const layout = {
        startX: 50,
        col1: 50, // Item
        col2: 300, // Qty
        col3: 370, // Price
        col4: 460, // Total
        width: 500,
      };

      // --- HELPER: DRAW LINE ---
      const drawLine = (y) => {
        doc
          .strokeColor(colors.divider)
          .lineWidth(1)
          .moveTo(layout.startX, y)
          .lineTo(layout.startX + layout.width, y)
          .stroke();
      };

      // ================= HEADER =================
      let topOffset = 50;

      // 1. Logo (Top Left)
      // Check if logo exists, otherwise draw a placeholder box
      if (fs.existsSync(invoice.company.logoPath)) {
        doc.image(invoice.company.logoPath, layout.startX, topOffset, {
          width: 50,
        });
      } else {
        // Fallback if no logo found
        doc.rect(layout.startX, topOffset, 50, 50).fill(colors.primary);
      }

      // 2. Company Info (Left, under logo)
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(colors.text)
        .text(invoice.company.name, layout.startX, topOffset + 60);

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(colors.secondary)
        .text(invoice.company.address, layout.startX)
        .text(invoice.company.city, layout.startX)
        .text(invoice.company.email, layout.startX);

      // 3. Invoice Title & Status (Top Right)
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor(colors.primary)
        .text("INVOICE", 0, topOffset, { align: "right", margin: 50 });

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(colors.secondary)
        .text(`# ${invoice.invoiceNumber}`, 0, topOffset + 25, {
          align: "right",
        });

      // Status Badge
      const statusX = 490; // Approx right side
      const statusY = topOffset + 45;

      // Draw status background
      doc
        .roundedRect(statusX, statusY, 60, 20, 10)
        .fill(invoice.status === "paid" ? "#DCFCE7" : "#FEE2E2"); // Green for paid, Red for unpaid

      // Draw status text
      doc
        .fillColor(invoice.status === "paid" ? "#166534" : "#991B1B")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(invoice.status.toUpperCase(), statusX, statusY + 5, {
          width: 60,
          align: "center",
        });

      // ================= CLIENT & DATES (Grid Layout) =================
      doc.moveDown();
      const infoTop = 160;

      // Column 1: Bill To
      // doc
      //   .fontSize(10)
      //   .font("Helvetica-Bold")
      //   .fillColor(colors.secondary)
      //   .text("BILL TO", layout.startX, infoTop);
      // doc.moveDown(0.5);
      // doc
      //   .fontSize(11)
      //   .font("Helvetica-Bold")
      //   .fillColor(colors.text)
      //   .text(invoice.customer.name);
      // doc
      //   .fontSize(10)
      //   .font("Helvetica")
      //   .fillColor(colors.secondary)
      //   .text(invoice.customer.address || "")
      //   .text(invoice.customer.city || "")
      //   .text(invoice.customer.phoneNumber);

      // Column 2: Details
      const col2X = 350;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(colors.secondary)
        .text("DETAILS", col2X, infoTop);
      doc.moveDown(0.5);

      // Detail Row Helper
      const detailRow = (label, value, y) => {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(colors.secondary)
          .text(label, col2X, y);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor(colors.text)
          .text(value, col2X + 80, y, { align: "right", width: 120 });
      };

      let detailY = doc.y;
      detailRow(
        "Date:",
        new Date(invoice.dateTime * 1000).toLocaleDateString(),
        detailY
      );
      detailRow(
        "Due Date:",
        new Date(invoice.dueDate * 1000).toLocaleDateString(),
        detailY + 15
      );

      // ================= TABLE =================
      const tableTop = 270;

      // Table Header Background
      doc
        .rect(layout.startX, tableTop, layout.width, 25)
        .fill(colors.background);

      // Table Header Text
      doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.text);
      doc.text("ITEM DESCRIPTION", layout.col1 + 10, tableTop + 8);
      doc.text("QTY", layout.col2, tableTop + 8);
      doc.text("PRICE", layout.col3, tableTop + 8);
      doc.text("TOTAL", layout.col4, tableTop + 8);

      let itemY = tableTop + 35;

      invoice.items.forEach((item) => {
        // Item Name
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(colors.text)
          .text(item.name, layout.col1 + 10, itemY, { width: 220 });

        // Quantity
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(colors.secondary)
          .text(item.quantity, layout.col2, itemY);

        // Price
        doc.text(`₹${item.perUnitPrice.toFixed(2)}`, layout.col3, itemY);

        // Total
        doc
          .font("Helvetica-Bold")
          .fillColor(colors.text)
          .text(`₹${item.totalPrice.toFixed(2)}`, layout.col4, itemY);

        itemY += 25;
        // Light divider line
        drawLine(itemY - 5);
      });

      // ================= SUMMARY SECTION =================
      const summaryTop = itemY + 20;
      const summaryLabelX = 350;
      const summaryValueX = 460;

      // Subtotal
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(colors.secondary)
        .text("Subtotal", summaryLabelX, summaryTop);
      doc
        .font("Helvetica-Bold")
        .fillColor(colors.text)
        .text(`₹${invoice.subTotal.toFixed(2)}`, summaryValueX, summaryTop);

      // Tax
      doc
        .font("Helvetica")
        .fillColor(colors.secondary)
        .text(
          `Tax (${invoice.taxPercentage}%)`,
          summaryLabelX,
          summaryTop + 20
        );
      doc
        .font("Helvetica-Bold")
        .fillColor(colors.text)
        .text(
          `₹${((invoice.subTotal * invoice.taxPercentage) / 100).toFixed(2)}`,
          summaryValueX,
          summaryTop + 20
        );

      // Divider for Total
      doc
        .strokeColor(colors.primary)
        .lineWidth(2)
        .moveTo(summaryLabelX, summaryTop + 40)
        .lineTo(summaryValueX + 80, summaryTop + 40)
        .stroke();

      // Total
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(colors.primary)
        .text("Total", summaryLabelX, summaryTop + 50);
      doc.text(
        `₹${invoice.totalAmount.toFixed(2)}`,
        summaryValueX - 10,
        summaryTop + 50
      ); // slight left adjust for larger font

      // ================= FOOTER =================
      const bottomY = 700;

      // Comments / Notes Box

      doc.roundedRect(layout.startX, 600, 250, 50, 5).fill(colors.background);
      doc
        .fillColor(colors.secondary)
        .fontSize(8)
        .text("NOTES:", layout.startX + 10, 605)
        .text("Thank you for your purchase.", layout.startX + 10, 620, {
          width: 230,
        });

      // Footer divider
      drawLine(bottomY);

      doc
        .fontSize(8)
        .fillColor(colors.secondary)
        .text(
          "Eat & Fly | info@khelaenterprises.com",
          layout.startX,
          bottomY + 10,
          { align: "center", width: layout.width }
        );

      doc.text("Thank you for your business!", layout.startX, bottomY + 25, {
        align: "center",
        width: layout.width,
      });

      doc.end();

      stream.on("finish", () => resolve({ filePath }));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };

// const path = require("path");
// const pdf = require("html-pdf");
// const ejs = require("ejs");
// const dayjs = require("dayjs");
// const phantomjs = require("phantomjs-prebuilt");

// const sanitize = async (order) => {
//   return {
//     invoiceNumber: "INV-2025-0012",

//     // UNIX timestamp (seconds)
//     dateTime: Math.floor(Date.now() / 1000),

//     airport: "Indira Gandhi International Airport (DEL)",

//     status: "paid", // paid | pending | overdue

//     customer: {
//       name: "Rahul Sharma",
//       email: "rahul.sharma@example.com",
//       phoneNumber: "+91 98765 43210",
//     },

//     items: [
//       {
//         name: "Airport Pickup Service",
//         quantity: 1,
//         perUnitPrice: 2500,
//         totalPrice: 2500,
//       },
//       {
//         name: "Extra Luggage Handling",
//         quantity: 2,
//         perUnitPrice: 300,
//         totalPrice: 600,
//       },
//       {
//         name: "Night Charges",
//         quantity: 1,
//         perUnitPrice: 400,
//         totalPrice: 400,
//       },
//     ],

//     subTotal: 3500, // 2500 + 600 + 400

//     taxPercentage: 18,

//     totalAmount: 4130, // subTotal + tax

//     comment: "Thank you for choosing our airport transfer service.",
//   };
// };

// exports.convertHTMLToPdf = async (data) => {
//   const sanitizedInvoice = await sanitize(data);
//   console.log("sanitizedInvoice", sanitizedInvoice);
//   return new Promise((resolve, reject) => {
//     ejs.renderFile(
//       path.join(__dirname, "./templates/invoice.ejs"),
//       { invoice: sanitizedInvoice || {} },
//       (err, html) => {
//         if (err) {
//           console.error("❌ EJS Render Error:", err);
//           return reject(err);
//         }

//         const fileName = `${
//           data?.invoiceNumber || Math.floor(Math.random() * 100000)
//         }-invoice.pdf`;
//         const fullPath = path.join(__dirname, "../../", fileName);

//         const options = {
//           height: "800px",
//           width: "10.7in",
//           header: { height: "0px" },
//           footer: { height: "0px" },
//           zoomFactor: "0.76",
//           type: "pdf",
//           childProcessOptions: {
//             env: {
//               OPENSSL_CONF: "/dev/null",
//             },
//           },
//         };

//         pdf.create(html, options).toFile(fullPath, (err, result) => {
//           if (err) {
//             console.error("❌ PDF creation error:", err);
//             return reject(err);
//           }
//           console.log("✅ PDF saved at:", fullPath);
//           return resolve({ location: fullPath });
//         });
//       }
//     );
//   });
// };
