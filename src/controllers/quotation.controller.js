const quotationService = require("../services/quotation.service");

async function createQuotation(req, res) {
  try {
    const quotation = await quotationService.createQuotation(
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      data: quotation,
    });
  } catch (error) {
    console.error("Create quotation error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getQuotations(req, res) {
  try {
    const quotations = await quotationService.getQuotations({
      purchaseRequestId: req.query.purchaseRequestId,
      vendorId: req.query.vendorId,
      status: req.query.status,
    });

    return res.status(200).json({
      success: true,
      count: quotations.length,
      data: quotations,
    });
  } catch (error) {
    console.error("Get quotations error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getQuotationById(req, res) {
  try {
    const quotation = await quotationService.getQuotationById(
      Number(req.params.id)
    );

    return res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    console.error("Get quotation error:", error);

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateQuotation(req, res) {
  try {
    const quotation = await quotationService.updateQuotation(
      Number(req.params.id),
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      data: quotation,
    });
  } catch (error) {
    console.error("Update quotation error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function submitQuotation(req, res) {
  try {
    const quotation =
      await quotationService.submitQuotation(
        Number(req.params.id)
      );

    return res.status(200).json({
      success: true,
      message: "Quotation submitted successfully",
      data: quotation,
    });
  } catch (error) {
    console.error("Submit quotation error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function selectQuotation(req, res) {
  try {
    const quotation =
      await quotationService.selectQuotation(
        Number(req.params.id)
      );

    return res.status(200).json({
      success: true,
      message: "Quotation selected successfully",
      data: quotation,
    });
  } catch (error) {
    console.error("Select quotation error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function rejectQuotation(req, res) {
  try {
    const quotation =
      await quotationService.rejectQuotation(
        Number(req.params.id)
      );

    return res.status(200).json({
      success: true,
      message: "Quotation rejected successfully",
      data: quotation,
    });
  } catch (error) {
    console.error("Reject quotation error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function cancelQuotation(req, res) {
  try {
    const quotation =
      await quotationService.cancelQuotation(
        Number(req.params.id)
      );

    return res.status(200).json({
      success: true,
      message: "Quotation cancelled successfully",
      data: quotation,
    });
  } catch (error) {
    console.error("Cancel quotation error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  submitQuotation,
  selectQuotation,
  rejectQuotation,
  cancelQuotation,
};