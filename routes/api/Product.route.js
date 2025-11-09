const addProduct = require("../../controllers/product/addProduct");
const deleteProduct = require("../../controllers/product/deleteProduct");
const getProducts = require("../../controllers/product/getAllProducts");
const getProductById = require("../../controllers/product/getSingleProduct");
const updateProduct = require("../../controllers/product/updateProduct");
const isAdmin = require("../../middlewares/isAdmin");

const router = require("express").Router();

// GET /api/products
router.get("/", isAdmin, getProducts); // Add auth middleware here

// GET /api/products/:id
router.get("/:id", isAdmin, getProductById); // Add auth middleware here

// POST /api/products
router.post("/", isAdmin, addProduct); // Add auth middleware here

// PUT /api/products/:id
router.put("/:id", isAdmin, updateProduct); // Add auth middleware here

// DELETE /api/products/:id
router.delete("/:id", isAdmin, deleteProduct);

module.exports = router;
