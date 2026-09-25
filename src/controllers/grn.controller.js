const grnService = require("../services/grn.service");

/**
 * CREATE GRN
 */
async function createGRN(req, res) {
  try {
    const grn =
      await grnService.createGRN(
        req.body,
        req.user.userId
      );

    return res.status(201).json({
      success: true,
      message:
        "Goods Received Note created successfully",
      data: grn,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * GET GRNs
 */
async function getGRNs(req, res) {
  try {
    const grns =
      await grnService.getGRNs(
        req.query
      );

    return res.status(200).json({
      success: true,
      data: grns,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * GET GRN BY ID
 */
async function getGRNById(req, res) {
  try {
    const grn =
      await grnService.getGRNById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: grn,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createGRN,
  getGRNs,
  getGRNById,
};