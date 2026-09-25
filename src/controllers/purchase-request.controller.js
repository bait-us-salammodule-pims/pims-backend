const purchaseRequestService = require("../services/purchase-request.service");

// =====================================================
// CREATE
// =====================================================

const createPurchaseRequest = async (req, res, next) => {
  try {
    const {
      departmentId,
      branchId,
      storeId,
      purpose,
      requiredDate,
      remarks,
      items,
    } = req.body;

    if (!departmentId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "departmentId and branchId are required",
      });
    }

    if (!purpose || !purpose.trim()) {
      return res.status(400).json({
        success: false,
        message: "Purpose is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    for (const item of items) {
      if (!item.itemId || !item.requestedQuantity) {
        return res.status(400).json({
          success: false,
          message: "Each item requires itemId and requestedQuantity",
        });
      }

      if (
        !Number.isInteger(item.requestedQuantity) ||
        item.requestedQuantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "requestedQuantity must be greater than 0",
        });
      }
    }

    const purchaseRequest =
      await purchaseRequestService.createPurchaseRequest(
        req.user.userId,
        {
          departmentId: Number(departmentId),
          branchId: Number(branchId),
          storeId: storeId ? Number(storeId) : null,
          purpose: purpose.trim(),
          requiredDate,
          remarks,
          items,
        }
      );

    return res.status(201).json({
      success: true,
      message: "Purchase request created successfully",
      data: purchaseRequest,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// GET ALL
// =====================================================

const getPurchaseRequests = async (req, res, next) => {
  try {
    const requests =
      await purchaseRequestService.getPurchaseRequests(req.user);

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// GET BY ID
// =====================================================

const getPurchaseRequestById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase request ID",
      });
    }

    const purchaseRequest =
      await purchaseRequestService.getPurchaseRequestById(
        id,
        req.user
      );

    return res.status(200).json({
      success: true,
      data: purchaseRequest,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// UPDATE
// =====================================================

const updatePurchaseRequest = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase request ID",
      });
    }

    const {
      departmentId,
      branchId,
      storeId,
      purpose,
      requiredDate,
      remarks,
      items,
    } = req.body;

    if (!departmentId || !branchId || !purpose) {
      return res.status(400).json({
        success: false,
        message: "departmentId, branchId and purpose are required",
      });
    }

    const updated =
      await purchaseRequestService.updatePurchaseRequest(
        id,
        req.user,
        {
          departmentId: Number(departmentId),
          branchId: Number(branchId),
          storeId: storeId ? Number(storeId) : null,
          purpose: purpose.trim(),
          requiredDate,
          remarks,
          items,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Purchase request updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// SUBMIT
// =====================================================

const submitPurchaseRequest = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase request ID",
      });
    }

    const result =
      await purchaseRequestService.submitPurchaseRequest(
        id,
        req.user
      );

    return res.status(200).json({
      success: true,
      message: "Purchase request submitted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// APPROVE
// =====================================================

const approvePurchaseRequest = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase request ID",
      });
    }

    const result =
      await purchaseRequestService.approvePurchaseRequest(
        id,
        req.user,
        req.body.comments
      );

    return res.status(200).json({
      success: true,
      message: "Purchase request approved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// REJECT
// =====================================================

const rejectPurchaseRequest = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase request ID",
      });
    }

    const result =
      await purchaseRequestService.rejectPurchaseRequest(
        id,
        req.user,
        req.body.comments
      );

    return res.status(200).json({
      success: true,
      message: "Purchase request rejected successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createPurchaseRequest,
  getPurchaseRequests,
  getPurchaseRequestById,
  updatePurchaseRequest,
  submitPurchaseRequest,
  approvePurchaseRequest,
  rejectPurchaseRequest,
};