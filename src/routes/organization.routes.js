const express = require("express");

const organizationController = require("../controllers/organization.controller");

const {
  authenticate,
  authorize,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.post(
  "/departments",
  organizationController.createDepartment
);

router.get(
  "/departments",
  organizationController.getDepartments
);

router.post(
  "/branches",
  organizationController.createBranch
);

router.get(
  "/branches",
  organizationController.getBranches
);

router.post(
  "/stores",
  organizationController.createStore
);

router.get(
  "/stores",
  organizationController.getStores
);

module.exports = router;