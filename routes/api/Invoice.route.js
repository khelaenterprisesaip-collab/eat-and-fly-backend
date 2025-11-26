const addInvoice = require("../../controllers/invoice/addInvoice");

const router = require("express").Router();

// GET /api/products
router.post("/", addInvoice); // Add auth middleware here

module.exports = router;
