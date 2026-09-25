const purchaseOrderService = require("../services/purchase-order.service");

/**
 * CREATE PURCHASE ORDER
 */
async function createPurchaseOrder(req, res) {
  try {
    const purchaseOrder =
      await purchaseOrderService.createPurchaseOrder(
        req.body,
        req.user.userId
      );

    return res.status(201).json({
      success: true,
      message:
        "Purchase Order created successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * GET PURCHASE ORDERS
 */
async function getPurchaseOrders(req, res) {
  try {
    const purchaseOrders =
      await purchaseOrderService.getPurchaseOrders(
        req.query
      );

    return res.status(200).json({
      success: true,
      data: purchaseOrders,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * GET PURCHASE ORDER BY ID
 */
async function getPurchaseOrderById(req, res) {
  try {
    const purchaseOrder =
      await purchaseOrderService.getPurchaseOrderById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * UPDATE PURCHASE ORDER
 */
async function updatePurchaseOrder(req, res) {
  try {
    const purchaseOrder =
      await purchaseOrderService.updatePurchaseOrder(
        req.params.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Purchase Order updated successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * ISSUE PURCHASE ORDER
 */
async function issuePurchaseOrder(req, res) {
  try {
    const purchaseOrder =
      await purchaseOrderService.issuePurchaseOrder(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Purchase Order issued successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * CANCEL PURCHASE ORDER
 */
async function cancelPurchaseOrder(req, res) {
  try {
    const purchaseOrder =
      await purchaseOrderService.cancelPurchaseOrder(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Purchase Order cancelled successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  issuePurchaseOrder,
  cancelPurchaseOrder,
};