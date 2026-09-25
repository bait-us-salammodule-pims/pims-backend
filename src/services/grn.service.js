const prisma = require("../config/database");

/**
 * Generate GRN number
 *
 * Example:
 * GRN-2026-00001
 */
async function generateGRNNumber() {
  const year = new Date().getFullYear();

  const lastGRN =
    await prisma.goodsReceivedNote.findFirst({
      where: {
        grnNumber: {
          startsWith: `GRN-${year}-`,
        },
      },
      orderBy: {
        id: "desc",
      },
    });

  let nextNumber = 1;

  if (lastGRN) {
    const lastNumber = parseInt(
      lastGRN.grnNumber.split("-")[2],
      10
    );

    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `GRN-${year}-${String(nextNumber).padStart(5, "0")}`;
}

/**
 * CREATE GRN
 */
async function createGRN(data, userId) {
  const {
    purchaseOrderId,
    receivedDate,
    deliveryNoteNumber,
    remarks,
    items,
  } = data;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      "At least one GRN item is required"
    );
  }

  /**
   * Get PO
   */
  const purchaseOrder =
    await prisma.purchaseOrder.findUnique({
      where: {
        id: Number(purchaseOrderId),
      },

      include: {
        items: true,
        vendor: true,
      },
    });

  if (!purchaseOrder) {
    throw new Error(
      "Purchase Order not found"
    );
  }

  /**
   * Only ISSUED PO can be received
   */
  if (purchaseOrder.status !== "ISSUED") {
    throw new Error(
      `Goods can only be received against ISSUED Purchase Order. Current status: ${purchaseOrder.status}`
    );
  }

  /**
   * Validate received items
   */
  const grnItems = [];

  for (const inputItem of items) {
    const purchaseOrderItem =
      purchaseOrder.items.find(
        (poItem) =>
          poItem.id ===
          Number(inputItem.purchaseOrderItemId)
      );

    if (!purchaseOrderItem) {
      throw new Error(
        `Purchase Order Item ${inputItem.purchaseOrderItemId} not found`
      );
    }

    const receivedQuantity = Number(
      inputItem.receivedQuantity
    );

    if (
      !Number.isInteger(receivedQuantity) ||
      receivedQuantity <= 0
    ) {
      throw new Error(
        `Invalid received quantity for PO item ${purchaseOrderItem.id}`
      );
    }

    const remainingQuantity =
      purchaseOrderItem.quantity -
      purchaseOrderItem.receivedQuantity;

    if (
      receivedQuantity >
      remainingQuantity
    ) {
      throw new Error(
        `Received quantity cannot exceed remaining quantity ${remainingQuantity} for PO item ${purchaseOrderItem.id}`
      );
    }

    grnItems.push({
      purchaseOrderItemId:
        purchaseOrderItem.id,

      itemId:
        purchaseOrderItem.itemId,

      receivedQuantity,

      remarks:
        inputItem.remarks || null,
    });
  }

  const grnNumber =
    await generateGRNNumber();

  /**
   * Transaction:
   *
   * 1. Create GRN
   * 2. Update PO received quantities
   * 3. Calculate PO status
   */
  const grn = await prisma.$transaction(
    async (tx) => {
      const createdGRN =
        await tx.goodsReceivedNote.create({
          data: {
            grnNumber,

            purchaseOrderId:
              purchaseOrder.id,

            receivedDate: receivedDate
              ? new Date(receivedDate)
              : new Date(),

            receivedById: Number(userId),

            deliveryNoteNumber:
              deliveryNoteNumber || null,

            remarks:
              remarks || null,

            status: "RECEIVED",

            items: {
              create: grnItems,
            },
          },

          include: {
            purchaseOrder: true,

            receivedBy: {
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

      /**
       * Update each PO item
       */
      for (const grnItem of grnItems) {
        const poItem =
          purchaseOrder.items.find(
            (item) =>
              item.id ===
              grnItem.purchaseOrderItemId
          );

        await tx.purchaseOrderItem.update({
          where: {
            id: poItem.id,
          },

          data: {
            receivedQuantity: {
              increment:
                grnItem.receivedQuantity,
            },
          },
        });
      }

      /**
       * Check final PO status
       */
      const updatedPO =
        await tx.purchaseOrder.findUnique({
          where: {
            id: purchaseOrder.id,
          },

          include: {
            items: true,
          },
        });

      const allReceived =
        updatedPO.items.every(
          (item) =>
            item.receivedQuantity >=
            item.quantity
        );

      const anyReceived =
        updatedPO.items.some(
          (item) =>
            item.receivedQuantity > 0
        );

      let newStatus = "ISSUED";

      if (allReceived) {
        newStatus = "COMPLETED";
      } else if (anyReceived) {
        newStatus = "PARTIALLY_RECEIVED";
      }

      await tx.purchaseOrder.update({
        where: {
          id: purchaseOrder.id,
        },

        data: {
          status: newStatus,
        },
      });

      return createdGRN;
    }
  );

  return getGRNById(grn.id);
}

/**
 * GET ALL GRNs
 */
async function getGRNs(filters = {}) {
  const where = {};

  if (filters.purchaseOrderId) {
    where.purchaseOrderId =
      Number(filters.purchaseOrderId);
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.goodsReceivedNote.findMany({
    where,

    include: {
      purchaseOrder: {
        include: {
          vendor: true,
        },
      },

      receivedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      items: {
        include: {
          item: true,
          purchaseOrderItem: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * GET GRN BY ID
 */
async function getGRNById(id) {
  const grn =
    await prisma.goodsReceivedNote.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        purchaseOrder: {
          include: {
            vendor: true,
            items: {
              include: {
                item: true,
              },
            },
          },
        },

        receivedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        items: {
          include: {
            item: true,
            purchaseOrderItem: true,
          },
        },
      },
    });

  if (!grn) {
    throw new Error("GRN not found");
  }

  return grn;
}

module.exports = {
  createGRN,
  getGRNs,
  getGRNById,
};