const InvoiceModel = require("../../models/Invoice.model");
// const uploadFiles = require("../../services/uploadFiles"); // If you want to delete PDF

const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params; // UUID of invoice

    // Find invoice first
    const invoice = await InvoiceModel.findOne({ uuid: id });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Delete from database
    await InvoiceModel.deleteOne({ uuid: id });

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.log("Error deleting invoice:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = deleteInvoice;
