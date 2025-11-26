const Invoice = require("../models/Invoice.model");

class InvoiceService {
  /**
   * Generate next invoice number like INV001 → INV002 → INV003
   */
  static async generateInvoiceNumber() {
    // Find last created invoice sorted by createdAt
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastInvoice?.invoiceNumber) {
      // Extract the digits e.g. "INV012" → 12
      const numericPart = parseInt(
        lastInvoice.invoiceNumber.replace("INV", ""),
        10
      );
      nextNumber = numericPart + 1;
    }

    // Convert to format INV001
    const formatted = `INV${String(nextNumber).padStart(3, "0")}`;

    return formatted;
  }
}

module.exports = InvoiceService;
