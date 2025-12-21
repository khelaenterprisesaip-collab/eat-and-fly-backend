const addProduct = require("../../controllers/product/addProduct");
const deleteProduct = require("../../controllers/product/deleteProduct");
const getProducts = require("../../controllers/product/getAllProducts");
const getProductsByAirport = require("../../controllers/product/getProductsByAirport");
const getProductById = require("../../controllers/product/getSingleProduct");
const updateProduct = require("../../controllers/product/updateProduct");

const router = require("express").Router();

// GET /api/products
router.get("/", getProducts); // Add auth middleware here

// GET /api/products/:id
router.get("/:id", getProductById); // Add auth middleware here

// POST /api/products
router.post("/", addProduct); // Add auth middleware here

// PUT /api/products/:id
router.put("/:id", updateProduct); // Add auth middleware here

// DELETE /api/products/:id
router.delete("/:id", deleteProduct);

router.get("/airport", getProductsByAirport);

module.exports = router;
