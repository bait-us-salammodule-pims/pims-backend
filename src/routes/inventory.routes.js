const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../middleware/auth.middleware");

const {
  createTransaction,
  getStockBalances,
  getStockByItem,
  getLedger,
  getLedgerById,
} = require("../controllers/inventory.controller");

/**
 * CREATE INVENTORY TRANSACTION
 *
 * Admin / Store Manager / Storekeeper
 */
router.post(
  "/transactions",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER"
  ),
  createTransaction
);

/**
 * GET STOCK BALANCES
 */
router.get(
  "/stock",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER",
    "PROCUREMENT_OFFICER",
    "DEPARTMENT_MANAGER"
  ),
  getStockBalances
);

/**
 * GET STOCK BY ITEM
 */
router.get(
  "/stock/:itemId",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER",
    "PROCUREMENT_OFFICER",
    "DEPARTMENT_MANAGER"
  ),
  getStockByItem
);

/**
 * GET INVENTORY LEDGER
 */
router.get(
  "/ledger",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER",
    "PROCUREMENT_OFFICER",
    "DEPARTMENT_MANAGER"
  ),
  getLedger
);

/**
 * GET LEDGER ENTRY
 */
router.get(
  "/ledger/:id",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER",
    "PROCUREMENT_OFFICER",
    "DEPARTMENT_MANAGER"
  ),
  getLedgerById
);

module.exports = router;