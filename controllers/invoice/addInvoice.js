const InvoiceModel = require("../../models/Invoice.model");
const InvoiceService = require("../../services/invoice/generateInvoiceNumber");
const { generateInvoicePDF } = require("../../utils/htmlToPdf");
const uploadFiles = require("../../services/util/upload-files");
const dayjs = require("dayjs");

const addInvoice = async (req, res) => {
  try {
    const airport = req.body?.airport;
    if (!airport) {
      return res
        .status(400)
        .json({ message: "Airport information missing from user" });
    }

    const {
      dateTime,
      // customer,
      subTotal,
      cgstPercentage, // Added
      igstPercentage, // Added
      discountPercentage, // Added
      discount, // Added
      totalAmount,
      status,
      items,
      paymentMethod,
      // comment,
    } = req.body;

    // STEP 1: Generate invoice number
    const invoiceNumber = await InvoiceService.generateInvoiceNumber();

    // STEP 2: Create invoice WITHOUT PDF first
    const newInvoice = new InvoiceModel({
      invoiceNumber,
      airport,
      dateTime,
      // customer,
      subTotal,
      cgstPercentage,
      igstPercentage,
      discountPercentage,
      discount,
      totalAmount,
      status,
      items,
      paymentMethod,
      // comment,
    });

    // STEP 3: Prepare data for PDF template
    // Ensure all new fields are passed here
    const invoiceTemplateData = {
      invoiceNumber,
      dateTime,
      airport,
      // customer,
      items,
      subTotal,
      cgstPercentage: cgstPercentage || 0,
      igstPercentage: igstPercentage || 0,
      discountPercentage: discountPercentage || 0,
      discount: discount || 0,
      totalAmount,
      status,
      // comment,
      createdAt: dayjs().toISOString(),
      invoiceId: newInvoice.uuid,
    };

    // STEP 4: Generate + upload PDF
    const { Location, key } = await createInvoice(invoiceTemplateData);

    newInvoice.pdf = {
      name: key || "invoice.pdf",
      url: Location,
    };

    await newInvoice.save();

    return res.status(201).json({
      message: "Invoice created successfully",
      invoice: newInvoice,
    });
  } catch (error) {
    console.log("Error creating invoice:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createInvoice = (invoiceData) =>
  generateInvoicePDF(invoiceData).then(async ({ filePath }) => {
    return uploadFiles.upload(
      filePath,
      "invoice.pdf",
      "invoice",
      "application/pdf"
    );
  });

module.exports = addInvoice;
