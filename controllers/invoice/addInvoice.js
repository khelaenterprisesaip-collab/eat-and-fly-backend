const InvoiceModel = require("../../models/Invoice.model");
const InvoiceService = require("../../services/invoice/generateInvoiceNumber");
const { convertHTMLToPdf } = require("../../utils/htmlToPdf");
const uploadFiles = require("../../services/util/upload-files");

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
      customer,
      subTotal,
      taxPercentage,
      totalAmount,
      status,
      items,
      paymentMethod,
      comment,
    } = req.body;

    // STEP 1: Generate invoice number
    const invoiceNumber = await InvoiceService.generateInvoiceNumber();

    // STEP 2: Create invoice WITHOUT PDF first
    const newInvoice = new InvoiceModel({
      invoiceNumber,
      airport,
      dateTime,
      customer,
      subTotal,
      taxPercentage,
      totalAmount,
      status,
      items,
      paymentMethod,
      comment,
    });

    // STEP 3: Prepare data for PDF template
    const invoiceTemplateData = {
      invoiceNumber,
      dateTime,
      airport,
      customer,
      items,
      subTotal,
      taxPercentage,
      totalAmount,
      status,
      comment,
      createdAt: newInvoice.createdAt,
      invoiceId: newInvoice.uuid,
    };

    // STEP 4: Generate + upload PDF
    // const { Location, key } = await createInvoice(invoiceTemplateData);

    // STEP 5: Update DB with PDF info
    newInvoice.pdf = {
      // name: key || "invoice.pdf",
      // url: Location,
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

module.exports = addInvoice;

const createInvoice = (invoiceData) =>
  convertHTMLToPdf(invoiceData).then(({ location }) =>
    uploadFiles.upload(location, "invoice.pdf", "invoice", "application/pdf")
  );

//example payload for invoice pdf
//   {
//   "invoiceNumber": "INV001",
//   "airport": "amritsar",
//   "dateTime": 1732611800,
//   "status": "unpaid",
//   "customer": {
//     "name": "John Doe",
//     "email": "john.doe@example.com",
//     "phoneNumber": 9876543210
//   },
//   "items": [
//     {
//       "name": "Airport Pickup (Amritsar to City)",
//       "quantity": 1,
//       "perUnitPrice": 1200,
//       "totalPrice": 1200
//     },
//     {
//       "name": "Waiting Charges",
//       "quantity": 2,
//       "perUnitPrice": 150,
//       "totalPrice": 300
//     }
//   ],
//   "subTotal": 1500,
//   "taxPercentage": 18,
//   "totalAmount": 1770,
//   "paymentMethod": "cash",
//   "comment": "Thank you for choosing our airport ride services.",
//   "createdAt": "2025-01-26T10:30:00.000Z",
//   "invoiceId": "8e0e8c3b-9c3e-4fa1-9095-2897cc1f3420"
// }
