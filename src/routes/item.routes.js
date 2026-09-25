const express = require("express");

const itemController = require("../controllers/item.controller");

const {
  authenticate,
  authorize,
} = require("../middleware/auth.middleware");

const router = express.Router();

// All item APIs require authentication
router.use(authenticate);

// For now item management is ADMIN-only
router.use(authorize("ADMIN"));

// ==============================
// ITEM CATEGORIES
// ==============================

router.post(
  "/categories",
  itemController.createCategory
);

router.get(
  "/categories",
  itemController.getCategories
);

// ==============================
// ITEMS
// ==============================

router.post(
  "/",
  itemController.createItem
);

router.get(
  "/",
  itemController.getItems
);

router.get(
  "/:id",
  itemController.getItemById
);

router.put(
  "/:id",
  itemController.updateItem
);

router.patch(
  "/:id/deactivate",
  itemController.deactivateItem
);

module.exports = router;