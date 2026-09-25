const organizationService = require("../services/organization.service");

const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Department name and code are required",
      });
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Department name must be at least 2 characters",
      });
    }

    if (trimmedCode.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Department code must be at least 2 characters",
      });
    }

    const department = await organizationService.createDepartment({
      name: trimmedName,
      code: trimmedCode,
      description: description?.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await organizationService.getDepartments();

    return res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createBranch = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      description,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Branch name and code are required",
      });
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Branch name must be at least 2 characters",
      });
    }

    if (trimmedCode.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Branch code must be at least 2 characters",
      });
    }

    const branch = await organizationService.createBranch({
      name: trimmedName,
      code: trimmedCode,
      address: address?.trim(),
      description: description?.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getBranches = async (req, res) => {
  try {
    const branches = await organizationService.getBranches();

    return res.status(200).json({
      success: true,
      data: branches,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createStore = async (req, res) => {
  try {
    const {
      name,
      code,
      branchId,
      description,
    } = req.body;

    if (!name || !code || !branchId) {
      return res.status(400).json({
        success: false,
        message: "Store name, code and branchId are required",
      });
    }

    const numericBranchId = Number(branchId);

    if (!Number.isInteger(numericBranchId) || numericBranchId <= 0) {
      return res.status(400).json({
        success: false,
        message: "branchId must be a valid positive integer",
      });
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Store name must be at least 2 characters",
      });
    }

    if (trimmedCode.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Store code must be at least 2 characters",
      });
    }

    const store = await organizationService.createStore({
      name: trimmedName,
      code: trimmedCode,
      branchId: numericBranchId,
      description: description?.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: store,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getStores = async (req, res) => {
  try {
    const stores = await organizationService.getStores();

    return res.status(200).json({
      success: true,
      data: stores,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  createBranch,
  getBranches,
  createStore,
  getStores,
};