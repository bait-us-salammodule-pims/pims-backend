const vendorService = require("../services/vendor.service");

const createVendor = async (req, res) => {
  try {
    const {
      name,
      code,
      contactPerson,
      email,
      phone,
      address,
      description,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Vendor name and code are required",
      });
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Vendor name must be at least 2 characters",
      });
    }

    if (trimmedCode.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Vendor code must be at least 2 characters",
      });
    }

    const vendor = await vendorService.createVendor({
      name: trimmedName,
      code: trimmedCode,
      contactPerson: contactPerson?.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      description: description?.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: vendor,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getVendors = async (req, res) => {
  try {
    const vendors = await vendorService.getVendors();

    return res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getVendorById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    const vendor = await vendorService.getVendorById(id);

    return res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateVendor = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    const {
      name,
      code,
      contactPerson,
      email,
      phone,
      address,
      description,
    } = req.body;

    const updatedVendor = await vendorService.updateVendor(id, {
      name: name?.trim(),
      code: code?.trim().toUpperCase(),
      contactPerson: contactPerson?.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      description: description?.trim(),
    });

    return res.status(200).json({
      success: true,
      message: "Vendor updated successfully",
      data: updatedVendor,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deactivateVendor = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    const vendor = await vendorService.deactivateVendor(id);

    return res.status(200).json({
      success: true,
      message: "Vendor deactivated successfully",
      data: vendor,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deactivateVendor,
};