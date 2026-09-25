const itemService = require("../services/item.service");

// ==============================
// ITEM CATEGORY
// ==============================

const createCategory = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Category name and code are required",
      });
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Category name must be at least 2 characters",
      });
    }

    if (trimmedCode.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Category code must be at least 2 characters",
      });
    }

    const category = await itemService.createCategory({
      name: trimmedName,
      code: trimmedCode,
      description: description?.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Item category created successfully",
      data: category,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await itemService.getCategories();

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// ITEMS
// ==============================

const createItem = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      unit,
      reorderLevel,
      categoryId,
    } = req.body;

    if (!name || !code || !unit || !categoryId) {
      return res.status(400).json({
        success: false,
        message:
          "Item name, code, unit and categoryId are required",
      });
    }

    const numericCategoryId = Number(categoryId);
    const numericReorderLevel =
      reorderLevel === undefined ? 0 : Number(reorderLevel);

    if (
      !Number.isInteger(numericCategoryId) ||
      numericCategoryId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "categoryId must be a valid positive integer",
      });
    }

    if (
      !Number.isInteger(numericReorderLevel) ||
      numericReorderLevel < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "reorderLevel must be a non-negative integer",
      });
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedUnit = unit.trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Item name must be at least 2 characters",
      });
    }

    if (trimmedCode.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Item code must be at least 2 characters",
      });
    }

    if (trimmedUnit.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Unit is required",
      });
    }

    const item = await itemService.createItem({
      name: trimmedName,
      code: trimmedCode,
      description: description?.trim(),
      unit: trimmedUnit,
      reorderLevel: numericReorderLevel,
      categoryId: numericCategoryId,
    });

    return res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: item,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getItems = async (req, res) => {
  try {
    const items = await itemService.getItems();

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getItemById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid item id",
      });
    }

    const item = await itemService.getItemById(id);

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateItem = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid item id",
      });
    }

    const {
      name,
      code,
      description,
      unit,
      reorderLevel,
      categoryId,
    } = req.body;

    if (!name || !code || !unit || !categoryId) {
      return res.status(400).json({
        success: false,
        message:
          "Item name, code, unit and categoryId are required",
      });
    }

    const numericCategoryId = Number(categoryId);
    const numericReorderLevel =
      reorderLevel === undefined ? 0 : Number(reorderLevel);

    if (
      !Number.isInteger(numericCategoryId) ||
      numericCategoryId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "categoryId must be a valid positive integer",
      });
    }

    if (
      !Number.isInteger(numericReorderLevel) ||
      numericReorderLevel < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "reorderLevel must be a non-negative integer",
      });
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedUnit = unit.trim();

    const item = await itemService.updateItem(id, {
      name: trimmedName,
      code: trimmedCode,
      description: description?.trim(),
      unit: trimmedUnit,
      reorderLevel: numericReorderLevel,
      categoryId: numericCategoryId,
    });

    return res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: item,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deactivateItem = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid item id",
      });
    }

    const item = await itemService.deactivateItem(id);

    return res.status(200).json({
      success: true,
      message: "Item deactivated successfully",
      data: item,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  createItem,
  getItems,
  getItemById,
  updateItem,
  deactivateItem,
};