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
      subTotal,
      cgstPercentage, // Added
      igstPercentage, // Added
      discountPercentage, // Added
      discount, // Added
      discountAmount,
      totalAmount,
      status,
      items,
      payments,
      // comment,
    } = req.body;

    const roundMoney = (value) =>
      Number((Number(value) || 0).toFixed(2));

    // STEP 1: Generate invoice number
    const invoiceNumber = await InvoiceService.generateInvoiceNumber();
    const normalizedSubTotal = roundMoney(subTotal);
    const normalizedDiscount = roundMoney(discount ?? discountAmount ?? 0);
    const normalizedTotalAmount = roundMoney(totalAmount);
    const normalizedItems = Array.isArray(items)
      ? items.map((item) => ({
          ...item,
          quantity: Number(item.quantity || 0),
          perUnitPrice: roundMoney(item.perUnitPrice),
          totalPrice: roundMoney(item.totalPrice),
        }))
      : [];
    const normalizedPayments = Array.isArray(payments)
      ? payments.map((payment) => ({
          ...payment,
          amount: roundMoney(payment.amount),
        }))
      : [];
    const normalizedCgstPercentage = Number(cgstPercentage || 0);
    const normalizedIgstPercentage = Number(igstPercentage || 0);
    const normalizedDiscountPercentage = Number(discountPercentage || 0);

    // STEP 2: Create invoice WITHOUT PDF first
    const newInvoice = new InvoiceModel({
      invoiceNumber,
      airport,
      dateTime,
      subTotal: normalizedSubTotal,
      cgstPercentage: normalizedCgstPercentage,
      igstPercentage: normalizedIgstPercentage,
      discountPercentage: normalizedDiscountPercentage,
      discount: normalizedDiscount,
      totalAmount: normalizedTotalAmount,
      status,
      items: normalizedItems,
      payments: normalizedPayments,
      // comment,
    });

    // STEP 3: Prepare data for PDF template
    // Ensure all new fields are passed here
    const invoiceTemplateData = {
      invoiceNumber,
      dateTime,
      airport,
      items: normalizedItems,
      subTotal: normalizedSubTotal,
      cgstPercentage: normalizedCgstPercentage,
      igstPercentage: normalizedIgstPercentage,
      discountPercentage: normalizedDiscountPercentage,
      discount: normalizedDiscount,
      totalAmount: normalizedTotalAmount,
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
