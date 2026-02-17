const router = require("express").Router();
const addCategory = require("../../controllers/category/addCategory");
const getCategories = require("../../controllers/category/getCategory");
const updateCategory = require("../../controllers/category/updateCategory");
const deleteCategory = require("../../controllers/category/deleteCategory");
const getSingleCategory = require("../../controllers/category/getSingleCategory");

// GET /api/category
router.get("/", getCategories);

// POST /api/category
router.post("/", addCategory);

// PUT /api/category/:id
router.put("/:id", updateCategory);

// DELETE /api/category/:id
router.delete("/:id", deleteCategory);

// GET /api/category/:id
router.get("/:id", getSingleCategory);

module.exports = router;
