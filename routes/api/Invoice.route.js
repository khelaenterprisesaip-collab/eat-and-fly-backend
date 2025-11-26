const addInvoice = require("../../controllers/invoice/addInvoice");
const deleteInvoice = require("../../controllers/invoice/deleteInvoice");
const getInvoices = require("../../controllers/invoice/getInvoice");

const router = require("express").Router();

// GET /api/products
router.post("/", addInvoice);
router.get("/", getInvoices);
router.delete("/:id", deleteInvoice);

module.exports = router;
