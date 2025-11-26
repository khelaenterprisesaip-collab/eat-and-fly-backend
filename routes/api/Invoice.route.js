const addInvoice = require("../../controllers/invoice/addInvoice");
const getInvoices = require("../../controllers/invoice/getInvoice");

const router = require("express").Router();

// GET /api/products
router.post("/", addInvoice); // Add auth middleware here
router.get("/", getInvoices); // Add auth middleware here

module.exports = router;
