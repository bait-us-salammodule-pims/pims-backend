const prisma = require("../config/database");

/**
 * Generate Purchase Order Number
 *
 * Example:
 * PO-2026-00001
 */
async function generateOrderNumber() {
  const year = new Date().getFullYear();

  const lastOrder = await prisma.purchaseOrder.findFirst({
    where: {
      orderNumber: {
        startsWith: `PO-${year}-`,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  let nextNumber = 1;

  if (lastOrder) {
    const lastNumber = parseInt(
      lastOrder.orderNumber.split("-")[2],
      10
    );

    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `PO-${year}-${String(nextNumber).padStart(5, "0")}`;
}

/**
 * CREATE PURCHASE ORDER
 *
 * PO can only be created from SELECTED quotation.
 */
async function createPurchaseOrder(data, userId) {
  const {
    quotationId,
    orderDate,
    expectedDeliveryDate,
    deliveryAddress,
    paymentTerms,
    remarks,
  } = data;

  const quotation = await prisma.quotation.findUnique({
    where: {
      id: Number(quotationId),
    },
    include: {
      vendor: true,
      purchaseRequest: true,
      items: {
        include: {
          item: true,
        },
      },
    },
  });

  if (!quotation) {
    throw new Error("Quotation not found");
  }

  if (quotation.status !== "SELECTED") {
    throw new Error(
      `Purchase Order can only be created from SELECTED quotation. Current status: ${quotation.status}`
    );
  }

  if (!quotation.vendor.isActive) {
    throw new Error("Vendor is inactive");
  }

  if (!quotation.items || quotation.items.length === 0) {
    throw new Error(
      "Selected quotation has no items"
    );
  }

  /**
   * Prevent duplicate PO for same quotation
   */
  const existingPO = await prisma.purchaseOrder.findFirst({
    where: {
      quotationId: Number(quotationId),
      status: {
        not: "CANCELLED",
      },
    },
  });

  if (existingPO) {
    throw new Error(
      "Purchase Order already exists for this quotation"
    );
  }

  const orderNumber = await generateOrderNumber();

  const purchaseOrderItems = quotation.items.map(
    (item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      receivedQuantity: 0,
      remarks: item.remarks || null,
    })
  );

  const purchaseOrder =
    await prisma.purchaseOrder.create({
      data: {
        orderNumber,

        quotationId: quotation.id,

        vendorId: quotation.vendorId,

        purchaseRequestId:
          quotation.purchaseRequestId,

        createdById: Number(userId),

        orderDate: orderDate
          ? new Date(orderDate)
          : new Date(),

        expectedDeliveryDate:
          expectedDeliveryDate
            ? new Date(expectedDeliveryDate)
            : null,

        deliveryAddress:
          deliveryAddress || null,

        paymentTerms:
          paymentTerms || null,

        remarks:
          remarks || null,

        status: "DRAFT",

        items: {
          create: purchaseOrderItems,
        },
      },

      include: {
        vendor: true,

        quotation: true,

        purchaseRequest: true,

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        items: {
          include: {
            item: true,
          },
        },
      },
    });

  return purchaseOrder;
}

/**
 * GET ALL PURCHASE ORDERS
 */
async function getPurchaseOrders(filters = {}) {
  const where = {};

  if (filters.vendorId) {
    where.vendorId = Number(filters.vendorId);
  }

  if (filters.quotationId) {
    where.quotationId =
      Number(filters.quotationId);
  }

  if (filters.purchaseRequestId) {
    where.purchaseRequestId =
      Number(filters.purchaseRequestId);
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.purchaseOrder.findMany({
    where,

    include: {
      vendor: true,

      quotation: true,

      purchaseRequest: {
        select: {
          id: true,
          requestNumber: true,
          purpose: true,
          status: true,
        },
      },

      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
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
 * GET PURCHASE ORDER BY ID
 */
async function getPurchaseOrderById(id) {
  const purchaseOrder =
    await prisma.purchaseOrder.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        vendor: true,

        quotation: true,

        purchaseRequest: {
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        items: {
          include: {
            item: true,
          },
        },
      },
    });

  if (!purchaseOrder) {
    throw new Error(
      "Purchase Order not found"
    );
  }

  return purchaseOrder;
}

/**
 * UPDATE PURCHASE ORDER
 *
 * Only DRAFT PO can be updated.
 */
async function updatePurchaseOrder(id, data) {
  const purchaseOrder =
    await prisma.purchaseOrder.findUnique({
      where: {
        id: Number(id),
      },
    });

  if (!purchaseOrder) {
    throw new Error(
      "Purchase Order not found"
    );
  }

  if (purchaseOrder.status !== "DRAFT") {
    throw new Error(
      "Only DRAFT Purchase Orders can be updated"
    );
  }

  const {
    orderDate,
    expectedDeliveryDate,
    deliveryAddress,
    paymentTerms,
    remarks,
  } = data;

  return prisma.purchaseOrder.update({
    where: {
      id: Number(id),
    },

    data: {
      orderDate: orderDate
        ? new Date(orderDate)
        : purchaseOrder.orderDate,

      expectedDeliveryDate:
        expectedDeliveryDate
          ? new Date(expectedDeliveryDate)
          : null,

      deliveryAddress:
        deliveryAddress !== undefined
          ? deliveryAddress
          : purchaseOrder.deliveryAddress,

      paymentTerms:
        paymentTerms !== undefined
          ? paymentTerms
          : purchaseOrder.paymentTerms,

      remarks:
        remarks !== undefined
          ? remarks
          : purchaseOrder.remarks,
    },

    include: {
      vendor: true,
      quotation: true,
      purchaseRequest: true,

      items: {
        include: {
          item: true,
        },
      },
    },
  });
}

/**
 * ISSUE PURCHASE ORDER
 */
async function issuePurchaseOrder(id) {
  const purchaseOrder =
    await prisma.purchaseOrder.findUnique({
      where: {
        id: Number(id),
      },
    });

  if (!purchaseOrder) {
    throw new Error(
      "Purchase Order not found"
    );
  }

  if (purchaseOrder.status !== "DRAFT") {
    throw new Error(
      "Only DRAFT Purchase Orders can be issued"
    );
  }

  return prisma.purchaseOrder.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "ISSUED",
    },

    include: {
      vendor: true,
      quotation: true,
      purchaseRequest: true,

      items: {
        include: {
          item: true,
        },
      },
    },
  });
}

/**
 * CANCEL PURCHASE ORDER
 */
async function cancelPurchaseOrder(id) {
  const purchaseOrder =
    await prisma.purchaseOrder.findUnique({
      where: {
        id: Number(id),
      },
    });

  if (!purchaseOrder) {
    throw new Error(
      "Purchase Order not found"
    );
  }

  if (
    purchaseOrder.status === "COMPLETED" ||
    purchaseOrder.status ===
      "PARTIALLY_RECEIVED"
  ) {
    throw new Error(
      "Received Purchase Order cannot be cancelled"
    );
  }

  if (purchaseOrder.status === "CANCELLED") {
    throw new Error(
      "Purchase Order is already cancelled"
    );
  }

  return prisma.purchaseOrder.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "CANCELLED",
    },

    include: {
      vendor: true,
      quotation: true,
      purchaseRequest: true,

      items: {
        include: {
          item: true,
        },
      },
    },
  });
}

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  issuePurchaseOrder,
  cancelPurchaseOrder,
};