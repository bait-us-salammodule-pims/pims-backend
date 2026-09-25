const express = require("express");

const router = express.Router();

const {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  submitQuotation,
  selectQuotation,
  rejectQuotation,
  cancelQuotation,
} = require("../controllers/quotation.controller");

const {
  authenticate,
  authorize,
} = require("../middleware/auth.middleware");

/*
 * Procurement Officer / Admin
 */

// Create quotation
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "PROCUREMENT_OFFICER"),
  createQuotation
);

// Get quotations
router.get(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "PROCUREMENT_OFFICER",
    "DEPARTMENT_MANAGER"
  ),
  getQuotations
);

// Get quotation by ID
router.get(
  "/:id",
  authenticate,
  authorize(
    "ADMIN",
    "PROCUREMENT_OFFICER",
    "DEPARTMENT_MANAGER"
  ),
  getQuotationById
);

// Update quotation
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "PROCUREMENT_OFFICER"),
  updateQuotation
);

// Submit quotation
router.post(
  "/:id/submit",
  authenticate,
  authorize("ADMIN", "PROCUREMENT_OFFICER"),
  submitQuotation
);

// Select quotation
router.post(
  "/:id/select",
  authenticate,
  authorize("ADMIN", "PROCUREMENT_OFFICER"),
  selectQuotation
);

// Reject quotation
router.post(
  "/:id/reject",
  authenticate,
  authorize("ADMIN", "PROCUREMENT_OFFICER"),
  rejectQuotation
);

// Cancel quotation
router.post(
  "/:id/cancel",
  authenticate,
  authorize("ADMIN", "PROCUREMENT_OFFICER"),
  cancelQuotation
);

module.exports = router;