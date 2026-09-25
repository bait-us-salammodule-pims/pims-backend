const express = require("express");

const vendorController = require("../controllers/vendor.controller");

const {
  authenticate,
  authorize,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.use(authorize("ADMIN"));

router.post(
  "/",
  vendorController.createVendor
);

router.get(
  "/",
  vendorController.getVendors
);

router.get(
  "/:id",
  vendorController.getVendorById
);

router.put(
  "/:id",
  vendorController.updateVendor
);

router.patch(
  "/:id/deactivate",
  vendorController.deactivateVendor
);

module.exports = router;