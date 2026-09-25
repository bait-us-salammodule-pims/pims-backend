const inventoryService =
  require("../services/inventory.service");

/**
 * CREATE INVENTORY TRANSACTION
 */
async function createTransaction(
  req,
  res
) {
  try {
    const result =
      await inventoryService.createTransaction(
        req.body,
        req.user.userId
      );

    return res.status(201).json({
      success: true,
      message:
        "Inventory transaction created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * GET STOCK BALANCES
 */
async function getStockBalances(
  req,
  res
) {
  try {
    const stocks =
      await inventoryService.getStockBalances(
        req.query
      );

    return res.status(200).json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * GET STOCK BY ITEM
 */
async function getStockByItem(
  req,
  res
) {
  try {
    const stock =
  await inventoryService.getStockByItem(
    req.params.itemId,
    req.query.storeId
  );

    return res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * GET LEDGER
 */
async function getLedger(
  req,
  res
) {
  try {
    const ledger =
      await inventoryService.getLedger(
        req.query
      );

    return res.status(200).json({
      success: true,
      data: ledger,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * GET LEDGER BY ID
 */
async function getLedgerById(
  req,
  res
) {
  try {
    const entry =
      await inventoryService.getLedgerById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createTransaction,
  getStockBalances,
  getStockByItem,
  getLedger,
  getLedgerById,
};