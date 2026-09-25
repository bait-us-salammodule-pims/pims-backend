const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../middleware/auth.middleware");

const {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  issuePurchaseOrder,
  cancelPurchaseOrder,
} = require("../controllers/purchase-order.controller");

/**
 * CREATE
 *
 * Only ADMIN and PROCUREMENT_OFFICER
 */
router.post(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "PROCUREMENT_OFFICER"
  ),
  createPurchaseOrder
);

/**
 * GET ALL
 */
router.get(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "PROCUREMENT_OFFICER",
    "DEPARTMENT_MANAGER",
    "STORE_MANAGER"
  ),
  getPurchaseOrders
);

/**
 * GET BY ID
 */
router.get(
  "/:id",
  authenticate,
  authorize(
    "ADMIN",
    "PROCUREMENT_OFFICER",
    "DEPARTMENT_MANAGER",
    "STORE_MANAGER"
  ),
  getPurchaseOrderById
);

/**
 * UPDATE
 */
router.put(
  "/:id",
  authenticate,
  authorize(
    "ADMIN",
    "PROCUREMENT_OFFICER"
  ),
  updatePurchaseOrder
);

/**
 * ISSUE
 */
router.post(
  "/:id/issue",
  authenticate,
  authorize(
    "ADMIN",
    "PROCUREMENT_OFFICER"
  ),
  issuePurchaseOrder
);

/**
 * CANCEL
 */
router.post(
  "/:id/cancel",
  authenticate,
  authorize(
    "ADMIN",
    "PROCUREMENT_OFFICER"
  ),
  cancelPurchaseOrder
);

module.exports = router;