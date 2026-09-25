const prisma = require("../config/database");

async function generateTransferNumber() {
  const year = new Date().getFullYear();

  const lastTransfer =
    await prisma.stockTransfer.findFirst({
      where: {
        transferNumber: {
          startsWith: `ST-${year}-`,
        },
      },
      orderBy: {
        id: "desc",
      },
    });

  let nextNumber = 1;

  if (lastTransfer) {
    const lastNumber = parseInt(
      lastTransfer.transferNumber.split("-")[2],
      10
    );

    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `ST-${year}-${String(nextNumber).padStart(5, "0")}`;
}

/**
 * CREATE TRANSFER
 */
async function createTransfer(data, userId) {
  const {
    sourceStoreId,
    destinationStoreId,
    transferDate,
    remarks,
    items,
  } = data;

  const sourceId = Number(sourceStoreId);
  const destinationId = Number(destinationStoreId);

  if (!sourceId || !destinationId) {
    throw new Error(
      "Source store and destination store are required"
    );
  }

  if (sourceId === destinationId) {
    throw new Error(
      "Source and destination stores cannot be the same"
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      "At least one transfer item is required"
    );
  }

  const [sourceStore, destinationStore] =
    await Promise.all([
      prisma.store.findUnique({
        where: {
          id: sourceId,
        },
      }),

      prisma.store.findUnique({
        where: {
          id: destinationId,
        },
      }),
    ]);

  if (!sourceStore) {
    throw new Error(
      "Source store not found"
    );
  }

  if (!destinationStore) {
    throw new Error(
      "Destination store not found"
    );
  }

  if (!sourceStore.isActive) {
    throw new Error(
      "Source store is inactive"
    );
  }

  if (!destinationStore.isActive) {
    throw new Error(
      "Destination store is inactive"
    );
  }

  const transferItems = [];

  for (const inputItem of items) {
    const itemId = Number(inputItem.itemId);
    const quantity = Number(inputItem.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(
        `Invalid quantity for item ${itemId}`
      );
    }

    const item =
      await prisma.item.findUnique({
        where: {
          id: itemId,
        },
      });

    if (!item) {
      throw new Error(
        `Item ${itemId} not found`
      );
    }

    if (!item.isActive) {
      throw new Error(
        `Item ${item.name} is inactive`
      );
    }

    transferItems.push({
      itemId,
      quantity,
      remarks: inputItem.remarks || null,
    });
  }

  const transferNumber =
    await generateTransferNumber();

  return prisma.stockTransfer.create({
    data: {
      transferNumber,

      sourceStoreId: sourceId,

      destinationStoreId: destinationId,

      createdById: Number(userId),

      transferDate: transferDate
        ? new Date(transferDate)
        : new Date(),

      remarks: remarks || null,

      status: "DRAFT",

      items: {
        create: transferItems,
      },
    },

    include: {
      sourceStore: true,

      destinationStore: true,

      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      items: {
        include: {
          item: true,
        },
      },
    },
  });
}

/**
 * GET ALL TRANSFERS
 */
async function getTransfers(filters = {}) {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.sourceStoreId) {
    where.sourceStoreId =
      Number(filters.sourceStoreId);
  }

  if (filters.destinationStoreId) {
    where.destinationStoreId =
      Number(filters.destinationStoreId);
  }

  return prisma.stockTransfer.findMany({
    where,

    include: {
      sourceStore: true,

      destinationStore: true,

      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      items: {
        include: {
          item: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * GET TRANSFER BY ID
 */
async function getTransferById(id) {
  const transfer =
    await prisma.stockTransfer.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        sourceStore: true,

        destinationStore: true,

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        items: {
          include: {
            item: true,
          },
        },
      },
    });

  if (!transfer) {
    throw new Error(
      "Stock transfer not found"
    );
  }

  return transfer;
}

/**
 * APPROVE TRANSFER
 */
async function approveTransfer(
  id,
  userId
) {
  const transfer =
    await prisma.stockTransfer.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        items: true,
      },
    });

  if (!transfer) {
    throw new Error(
      "Stock transfer not found"
    );
  }

  if (transfer.status !== "DRAFT") {
    throw new Error(
      `Only DRAFT transfers can be approved. Current status: ${transfer.status}`
    );
  }

  return prisma.stockTransfer.update({
    where: {
      id: transfer.id,
    },

    data: {
      status: "APPROVED",

      approvedById: Number(userId),
    },

    include: {
      sourceStore: true,
      destinationStore: true,
      items: {
        include: {
          item: true,
        },
      },
    },
  });
}

/**
 * DISPATCH TRANSFER
 *
 * Source stock is deducted here.
 */
async function dispatchTransfer(id, userId) {
  const transfer =
    await prisma.stockTransfer.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        items: true,
      },
    });

  if (!transfer) {
    throw new Error(
      "Stock transfer not found"
    );
  }

  if (transfer.status !== "APPROVED") {
    throw new Error(
      `Only APPROVED transfers can be dispatched. Current status: ${transfer.status}`
    );
  }

  return prisma.$transaction(
    async (tx) => {
      for (const transferItem of transfer.items) {
        const stock =
          await tx.stockBalance.findUnique({
            where: {
              itemId_storeId: {
                itemId: transferItem.itemId,
                storeId: transfer.sourceStoreId,
              },
            },
          });

        if (!stock) {
          throw new Error(
            `No stock found for item ${transferItem.itemId} in source store`
          );
        }

        if (
          stock.quantity <
          transferItem.quantity
        ) {
          throw new Error(
            `Insufficient stock for item ${transferItem.itemId}. Available: ${stock.quantity}, required: ${transferItem.quantity}`
          );
        }

        await tx.stockBalance.update({
          where: {
            itemId_storeId: {
              itemId: transferItem.itemId,
              storeId: transfer.sourceStoreId,
            },
          },

          data: {
            quantity: {
              decrement:
                transferItem.quantity,
            },
          },
        });

        await tx.inventoryLedger.create({
          data: {
            itemId: transferItem.itemId,

            storeId: transfer.sourceStoreId,

            transactionType:
              "TRANSFER_OUT",

            quantity:
              transferItem.quantity,

            referenceType:
              "STOCK_TRANSFER",

            referenceId:
              transfer.id,

            remarks:
              `Transfer ${transfer.transferNumber} dispatched`,

            createdById:
              Number(userId),
          },
        });
      }

      return tx.stockTransfer.update({
        where: {
          id: transfer.id,
        },

        data: {
          status: "IN_TRANSIT",
        },

        include: {
          sourceStore: true,
          destinationStore: true,
          items: {
            include: {
              item: true,
            },
          },
        },
      });
    }
  );
}

/**
 * RECEIVE TRANSFER
 *
 * Destination stock is increased here.
 */
async function receiveTransfer(
  id,
  userId
) {
  const transfer =
    await prisma.stockTransfer.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        items: true,
      },
    });

  if (!transfer) {
    throw new Error(
      "Stock transfer not found"
    );
  }

  if (transfer.status !== "IN_TRANSIT") {
    throw new Error(
      `Only IN_TRANSIT transfers can be received. Current status: ${transfer.status}`
    );
  }

  return prisma.$transaction(
    async (tx) => {
      for (const transferItem of transfer.items) {
        let stock =
          await tx.stockBalance.findUnique({
            where: {
              itemId_storeId: {
                itemId: transferItem.itemId,
                storeId: transfer.destinationStoreId,
              },
            },
          });

        if (!stock) {
          stock =
            await tx.stockBalance.create({
              data: {
                itemId:
                  transferItem.itemId,

                storeId:
                  transfer.destinationStoreId,

                quantity: 0,
              },
            });
        }

        await tx.stockBalance.update({
          where: {
            itemId_storeId: {
              itemId: transferItem.itemId,
              storeId:
                transfer.destinationStoreId,
            },
          },

          data: {
            quantity: {
              increment:
                transferItem.quantity,
            },
          },
        });

        await tx.inventoryLedger.create({
          data: {
            itemId:
              transferItem.itemId,

            storeId:
              transfer.destinationStoreId,

            transactionType:
              "TRANSFER_IN",

            quantity:
              transferItem.quantity,

            referenceType:
              "STOCK_TRANSFER",

            referenceId:
              transfer.id,

            remarks:
              `Transfer ${transfer.transferNumber} received`,

            createdById:
              Number(userId),
          },
        });
      }

      return tx.stockTransfer.update({
        where: {
          id: transfer.id,
        },

        data: {
          status: "COMPLETED",
        },

        include: {
          sourceStore: true,
          destinationStore: true,
          items: {
            include: {
              item: true,
            },
          },
        },
      });
    }
  );
}

/**
 * CANCEL TRANSFER
 */
async function cancelTransfer(id) {
  const transfer =
    await prisma.stockTransfer.findUnique({
      where: {
        id: Number(id),
      },
    });

  if (!transfer) {
    throw new Error(
      "Stock transfer not found"
    );
  }

  if (
    !["DRAFT", "APPROVED"].includes(
      transfer.status
    )
  ) {
    throw new Error(
      `Cannot cancel transfer in ${transfer.status} status`
    );
  }

  return prisma.stockTransfer.update({
    where: {
      id: transfer.id,
    },

    data: {
      status: "CANCELLED",
    },
  });
}

/**
 * UPDATE DRAFT
 */
async function updateTransfer(
  id,
  data
) {
  const transfer =
    await prisma.stockTransfer.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        items: true,
      },
    });

  if (!transfer) {
    throw new Error(
      "Stock transfer not found"
    );
  }

  if (transfer.status !== "DRAFT") {
    throw new Error(
      "Only DRAFT transfers can be updated"
    );
  }

  const updateData = {};

  if (data.remarks !== undefined) {
    updateData.remarks =
      data.remarks;
  }

  if (data.transferDate !== undefined) {
    updateData.transferDate =
      new Date(data.transferDate);
  }

  return prisma.stockTransfer.update({
    where: {
      id: transfer.id,
    },

    data: updateData,

    include: {
      sourceStore: true,
      destinationStore: true,
      items: {
        include: {
          item: true,
        },
      },
    },
  });
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