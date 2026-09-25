const express = require("express");

const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../middleware/auth.middleware");

const {
  createGRN,
  getGRNs,
  getGRNById,
} = require("../controllers/grn.controller");

/**
 * CREATE GRN
 *
 * Store manager / admin can receive goods.
 */
router.post(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER"
  ),
  createGRN
);

/**
 * GET ALL GRNs
 */
router.get(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER",
    "PROCUREMENT_OFFICER"
  ),
  getGRNs
);

/**
 * GET GRN BY ID
 */
router.get(
  "/:id",
  authenticate,
  authorize(
    "ADMIN",
    "STORE_MANAGER",
    "STOREKEEPER",
    "PROCUREMENT_OFFICER"
  ),
  getGRNById
);

module.exports = router;