const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../middleware/auth.middleware");

const {
  createTransfer,
  getTransfers,
  getTransferById,
  updateTransfer,
  approveTransfer,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer,
} = require("../controllers/stock-transfer.controller");

// CREATE
router.post(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER"
  ),
  createTransfer
);

// GET ALL
router.get(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER",
    "PROCUREMENT_OFFICER",
    "DEPARTMENT_MANAGER"
  ),
  getTransfers
);

// GET BY ID
router.get(
  "/:id",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER",
    "PROCUREMENT_OFFICER",
    "DEPARTMENT_MANAGER"
  ),
  getTransferById
);

// UPDATE DRAFT
router.put(
  "/:id",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER"
  ),
  updateTransfer
);

// APPROVE
router.post(
  "/:id/approve",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER"
  ),
  approveTransfer
);

// DISPATCH
router.post(
  "/:id/dispatch",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER"
  ),
  dispatchTransfer
);

// RECEIVE
router.post(
  "/:id/receive",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER"
  ),
  receiveTransfer
);

// CANCEL
router.post(
  "/:id/cancel",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER"
  ),
  cancelTransfer
);

module.exports = router;