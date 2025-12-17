const path = require("path");
const pdf = require("html-pdf");
const ejs = require("ejs");
const dayjs = require("dayjs");
// const phantomjs = require("phantomjs-prebuilt");

const sanitize = async (order) => {
  return order;
};

exports.convertHTMLToPdf = async (data) => {
  const sanitizedInvoice = await sanitize(data);
  console.log("sanitizedInvoice", sanitizedInvoice);
  return new Promise((resolve, reject) => {
    ejs.renderFile(
      path.join(__dirname, "./templates/invoice.ejs"),
      { invoice: sanitizedInvoice || {} },
      (err, html) => {
        if (err) {
          console.error("❌ EJS Render Error:", err);
          return reject(err);
        }

        const fileName = `${
          data?.invoiceNumber || Math.floor(Math.random() * 100000)
        }-invoice.pdf`;
        const fullPath = path.join(__dirname, "../../", fileName);

        const options = {
          height: "800px",
          width: "10.7in",
          header: { height: "0px" },
          footer: { height: "0px" },
          zoomFactor: "0.76",
          type: "pdf",
          // phantomPath: phantomjs.path,
        };

        pdf.create(html, options).toFile(fullPath, (err, result) => {
          if (err) {
            console.error("❌ PDF creation error:", err);
            return reject(err);
          }
          console.log("✅ PDF saved at:", fullPath);
          return resolve({ location: fullPath });
        });
      }
    );
  });
};
