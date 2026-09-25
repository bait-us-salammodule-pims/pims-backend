const service =
  require("../services/stock-transfer.service");

async function createTransfer(req, res) {
  try {
    const result =
      await service.createTransfer(
        req.body,
        req.user.userId
      );

    res.status(201).json({
      success: true,
      message:
        "Stock transfer created successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getTransfers(req, res) {
  try {
    const result =
      await service.getTransfers(
        req.query
      );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getTransferById(
  req,
  res
) {
  try {
    const result =
      await service.getTransferById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateTransfer(
  req,
  res
) {
  try {
    const result =
      await service.updateTransfer(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Stock transfer updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function approveTransfer(
  req,
  res
) {
  try {
    const result =
      await service.approveTransfer(
        req.params.id,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message:
        "Stock transfer approved successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function dispatchTransfer(
  req,
  res
) {
  try {
    const result =
      await service.dispatchTransfer(
        req.params.id,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message:
        "Stock transfer dispatched successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function receiveTransfer(
  req,
  res
) {
  try {
    const result =
      await service.receiveTransfer(
        req.params.id,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message:
        "Stock transfer received successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function cancelTransfer(
  req,
  res
) {
  try {
    const result =
      await service.cancelTransfer(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message:
        "Stock transfer cancelled successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createTransfer,
  getTransfers,
  getTransferById,
  updateTransfer,
  approveTransfer,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer,
};