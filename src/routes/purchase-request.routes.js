const express = require("express");

const {
  authenticate,
  authorize,
} = require("../middleware/auth.middleware");

const {
  createPurchaseRequest,
  getPurchaseRequests,
  getPurchaseRequestById,
  updatePurchaseRequest,
  submitPurchaseRequest,
  approvePurchaseRequest,
  rejectPurchaseRequest,
} = require("../controllers/purchase-request.controller");

const router = express.Router();


// =====================================================
// CREATE
// =====================================================

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "DEPARTMENT_USER"),
  createPurchaseRequest
);


// =====================================================
// GET ALL
// =====================================================

router.get(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "DEPARTMENT_USER",
    "DEPARTMENT_MANAGER",
    "PROCUREMENT_OFFICER"
  ),
  getPurchaseRequests
);


// =====================================================
// GET BY ID
// =====================================================

router.get(
  "/:id",
  authenticate,
  authorize(
    "ADMIN",
    "DEPARTMENT_USER",
    "DEPARTMENT_MANAGER",
    "PROCUREMENT_OFFICER"
  ),
  getPurchaseRequestById
);


// =====================================================
// UPDATE
// =====================================================

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "DEPARTMENT_USER"),
  updatePurchaseRequest
);


// =====================================================
// SUBMIT
// =====================================================

router.post(
  "/:id/submit",
  authenticate,
  authorize("ADMIN", "DEPARTMENT_USER"),
  submitPurchaseRequest
);


// =====================================================
// APPROVE
// =====================================================

router.patch(
  "/:id/approve",
  authenticate,
  authorize("ADMIN", "DEPARTMENT_MANAGER"),
  approvePurchaseRequest
);


// =====================================================
// REJECT
// =====================================================

router.patch(
  "/:id/reject",
  authenticate,
  authorize("ADMIN", "DEPARTMENT_MANAGER"),
  rejectPurchaseRequest
);


module.exports = router;