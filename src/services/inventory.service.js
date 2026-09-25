const prisma = require("../config/database");

/**
 * Get or create stock balance
 */
async function getOrCreateStockBalance(
  tx,
  itemId
) {
  let stock =
    await tx.stockBalance.findUnique({
      where: {
        itemId,
      },
    });

  if (!stock) {
    stock =
      await tx.stockBalance.create({
        data: {
          itemId,
          quantity: 0,
        },
      });
  }

  return stock;
}

/**
 * Calculate quantity change
 */
function getQuantityChange(
  transactionType,
  quantity
) {
  switch (transactionType) {
    case "RECEIPT":
    case "TRANSFER_IN":
    case "ADJUSTMENT_IN":
      return quantity;

    case "ISSUE":
    case "TRANSFER_OUT":
    case "ADJUSTMENT_OUT":
      return -quantity;

    default:
      throw new Error(
        "Invalid inventory transaction type"
      );
  }
}

/**
 * CREATE INVENTORY TRANSACTION
 */
async function createTransaction(
  data,
  userId
) {
  const {
    itemId,
    transactionType,
    quantity,
    referenceType,
    referenceId,
    remarks,
  } = data;

  const parsedItemId = Number(itemId);
  const parsedQuantity = Number(quantity);

  if (!parsedItemId) {
    throw new Error(
      "Item ID is required"
    );
  }

  if (
    !Number.isInteger(parsedQuantity) ||
    parsedQuantity <= 0
  ) {
    throw new Error(
      "Quantity must be a positive integer"
    );
  }

  const validTypes = [
    "RECEIPT",
    "ISSUE",
    "TRANSFER_IN",
    "TRANSFER_OUT",
    "ADJUSTMENT_IN",
    "ADJUSTMENT_OUT",
  ];

  if (
    !validTypes.includes(
      transactionType
    )
  ) {
    throw new Error(
      "Invalid inventory transaction type"
    );
  }

  const item =
    await prisma.item.findUnique({
      where: {
        id: parsedItemId,
      },
    });

  if (!item) {
    throw new Error(
      "Item not found"
    );
  }

  if (!item.isActive) {
    throw new Error(
      "Cannot create inventory transaction for inactive item"
    );
  }

  const quantityChange =
    getQuantityChange(
      transactionType,
      parsedQuantity
    );

  return prisma.$transaction(
    async (tx) => {
      const stock =
        await getOrCreateStockBalance(
          tx,
          parsedItemId
        );

      const newQuantity =
        stock.quantity +
        quantityChange;

      if (newQuantity < 0) {
        throw new Error(
          `Insufficient stock. Available: ${stock.quantity}, requested: ${parsedQuantity}`
        );
      }

      const ledger =
        await tx.inventoryLedger.create({
          data: {
            itemId: parsedItemId,

            transactionType,

            quantity:
              parsedQuantity,

            referenceType:
              referenceType || null,

            referenceId:
              referenceId
                ? Number(referenceId)
                : null,

            remarks:
              remarks || null,

            createdById:
              Number(userId),
          },

          include: {
            item: true,

            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      const updatedStock =
        await tx.stockBalance.update({
          where: {
            itemId: parsedItemId,
          },

          data: {
            quantity: newQuantity,
          },

          include: {
            item: true,
          },
        });

      return {
        ledger,
        stock: updatedStock,
      };
    }
  );
}

/**
 * GET STOCK BALANCES
 */
async function getStockBalances(
  filters = {}
) {
  const where = {};

  if (filters.itemId) {
    where.itemId =
      Number(filters.itemId);
  }

  return prisma.stockBalance.findMany({
    where,

    include: {
      item: {
        include: {
          category: true,
        },
      },
    },

    orderBy: {
      itemId: "asc",
    },
  });
}

/**
 * GET STOCK BY ITEM
 */
async function getStockByItem(
  itemId,
  storeId
) {
  const where = {
    itemId: Number(itemId),
  };

  if (storeId) {
    where.storeId = Number(storeId);
  }

  const stock =
    await prisma.stockBalance.findFirst({
      where,

      include: {
        item: {
          include: {
            category: true,
          },
        },

        store: true,
      },
    });

  if (!stock) {
    throw new Error(
      "Stock balance not found for this item/store"
    );
  }

  return stock;
}

/**
 * GET INVENTORY LEDGER
 */
async function getLedger(
  filters = {}
) {
  const where = {};

  if (filters.itemId) {
    where.itemId =
      Number(filters.itemId);
  }

  if (filters.transactionType) {
    where.transactionType =
      filters.transactionType;
  }

  if (filters.referenceType) {
    where.referenceType =
      filters.referenceType;
  }

  if (filters.referenceId) {
    where.referenceId =
      Number(filters.referenceId);
  }

  return prisma.inventoryLedger.findMany({
    where,

    include: {
      item: true,

      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },

    orderBy: {
      transactionDate: "desc",
    },
  });
}

/**
 * GET LEDGER BY ID
 */
async function getLedgerById(id) {
  const entry =
    await prisma.inventoryLedger.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        item: true,

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

  if (!entry) {
    throw new Error(
      "Inventory ledger entry not found"
    );
  }

  return entry;
}

module.exports = {
  createTransaction,
  getStockBalances,
  getStockByItem,
  getLedger,
  getLedgerById,
};