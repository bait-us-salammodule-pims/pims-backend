const prisma = require("../config/database");

/**
 * Generate quotation number
 * Example: QT-2026-00001
 */
async function generateQuotationNumber() {
  const year = new Date().getFullYear();

  const lastQuotation = await prisma.quotation.findFirst({
    where: {
      quotationNumber: {
        startsWith: `QT-${year}-`,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  let nextNumber = 1;

  if (lastQuotation) {
    const lastNumber = parseInt(
      lastQuotation.quotationNumber.split("-")[2],
      10
    );

    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `QT-${year}-${String(nextNumber).padStart(5, "0")}`;
}

/**
 * Validate quotation items against PR items
 */
async function validateQuotationItems(purchaseRequestId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one quotation item is required");
  }

  const purchaseRequest = await prisma.purchaseRequest.findUnique({
    where: {
      id: purchaseRequestId,
    },
    include: {
      items: true,
    },
  });

  if (!purchaseRequest) {
    throw new Error("Purchase Request not found");
  }

  for (const item of items) {
    if (!Number.isInteger(Number(item.itemId))) {
      throw new Error("Invalid itemId");
    }

    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
      throw new Error(
        `Invalid quantity for item ${item.itemId}`
      );
    }

    if (Number(item.unitPrice) <= 0 || isNaN(Number(item.unitPrice))) {
      throw new Error(
        `Invalid unit price for item ${item.itemId}`
      );
    }

    const prItem = purchaseRequest.items.find(
      (prItem) => prItem.itemId === Number(item.itemId)
    );

    if (!prItem) {
      throw new Error(
        `Item ${item.itemId} does not belong to Purchase Request`
      );
    }

    if (Number(item.quantity) > prItem.requestedQuantity) {
      throw new Error(
        `Quantity for item ${item.itemId} cannot exceed requested quantity ${prItem.requestedQuantity}`
      );
    }
  }

  return purchaseRequest;
}

/**
 * CREATE QUOTATION
 */
async function createQuotation(data) {
  const {
    purchaseRequestId,
    vendorId,
    quotationDate,
    validUntil,
    remarks,
    items,
  } = data;

  // Validate Purchase Request
  const purchaseRequest = await prisma.purchaseRequest.findUnique({
    where: {
      id: Number(purchaseRequestId),
    },
  });

  if (!purchaseRequest) {
    throw new Error("Purchase Request not found");
  }

  // Only APPROVED PR can have quotation
  if (purchaseRequest.status !== "APPROVED") {
    throw new Error(
      `Quotation can only be created for APPROVED Purchase Request. Current status: ${purchaseRequest.status}`
    );
  }

  // Validate vendor
  const vendor = await prisma.vendor.findUnique({
    where: {
      id: Number(vendorId),
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  if (!vendor.isActive) {
    throw new Error("Vendor is inactive");
  }

  // Validate quotation items
  await validateQuotationItems(
    Number(purchaseRequestId),
    items
  );

  // Prevent duplicate quotation for same PR + vendor
  const existingQuotation = await prisma.quotation.findFirst({
    where: {
      purchaseRequestId: Number(purchaseRequestId),
      vendorId: Number(vendorId),
      status: {
        not: "CANCELLED",
      },
    },
  });

  if (existingQuotation) {
    throw new Error(
      "Quotation already exists for this Purchase Request and Vendor"
    );
  }

  // Generate quotation number
  const quotationNumber = await generateQuotationNumber();

  // Prepare items
  const quotationItems = items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const totalPrice = quantity * unitPrice;

    return {
      itemId: Number(item.itemId),
      quantity,
      unitPrice,
      totalPrice,
      remarks: item.remarks || null,
    };
  });

  // Create quotation
  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      purchaseRequestId: Number(purchaseRequestId),
      vendorId: Number(vendorId),
      quotationDate: quotationDate
        ? new Date(quotationDate)
        : new Date(),
      validUntil: validUntil
        ? new Date(validUntil)
        : null,
      remarks: remarks || null,
      status: "DRAFT",

      items: {
        create: quotationItems,
      },
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

  return quotation;
}

/**
 * GET ALL QUOTATIONS
 */
async function getQuotations(filters = {}) {
  const where = {};

  if (filters.purchaseRequestId) {
    where.purchaseRequestId = Number(
      filters.purchaseRequestId
    );
  }

  if (filters.vendorId) {
    where.vendorId = Number(filters.vendorId);
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.quotation.findMany({
    where,

    include: {
      vendor: true,

      purchaseRequest: {
        select: {
          id: true,
          requestNumber: true,
          purpose: true,
          status: true,
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
 * GET QUOTATION BY ID
 */
async function getQuotationById(id) {
  const quotation = await prisma.quotation.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      vendor: true,

      purchaseRequest: {
        include: {
          items: {
            include: {
              item: true,
            },
          },
        },
      },

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

  return quotation;
}

/**
 * UPDATE QUOTATION
 */
async function updateQuotation(id, data) {
  const quotation = await prisma.quotation.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      purchaseRequest: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!quotation) {
    throw new Error("Quotation not found");
  }

  if (quotation.status !== "DRAFT") {
    throw new Error(
      "Only DRAFT quotations can be updated"
    );
  }

  const {
    quotationDate,
    validUntil,
    remarks,
    items,
  } = data;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      "At least one quotation item is required"
    );
  }

  // Validate items
  for (const item of items) {
    const prItem = quotation.purchaseRequest.items.find(
      (prItem) =>
        prItem.itemId === Number(item.itemId)
    );

    if (!prItem) {
      throw new Error(
        `Item ${item.itemId} does not belong to Purchase Request`
      );
    }

    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(
        `Invalid quantity for item ${item.itemId}`
      );
    }

    if (quantity > prItem.requestedQuantity) {
      throw new Error(
        `Quantity for item ${item.itemId} cannot exceed requested quantity ${prItem.requestedQuantity}`
      );
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error(
        `Invalid unit price for item ${item.itemId}`
      );
    }
  }

  const quotationItems = items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    return {
      itemId: Number(item.itemId),
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      remarks: item.remarks || null,
    };
  });

  const updatedQuotation =
    await prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({
        where: {
          quotationId: Number(id),
        },
      });

      return tx.quotation.update({
        where: {
          id: Number(id),
        },

        data: {
          quotationDate: quotationDate
            ? new Date(quotationDate)
            : quotation.quotationDate,

          validUntil: validUntil
            ? new Date(validUntil)
            : null,

          remarks:
            remarks !== undefined
              ? remarks
              : quotation.remarks,

          items: {
            create: quotationItems,
          },
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
    });

  return updatedQuotation;
}

/**
 * SUBMIT QUOTATION
 */
async function submitQuotation(id) {
  const quotation = await prisma.quotation.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!quotation) {
    throw new Error("Quotation not found");
  }

  if (quotation.status !== "DRAFT") {
    throw new Error(
      "Only DRAFT quotations can be submitted"
    );
  }

  return prisma.quotation.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "SUBMITTED",
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
}

/**
 * SELECT QUOTATION
 */
async function selectQuotation(id) {
  const quotation = await prisma.quotation.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!quotation) {
    throw new Error("Quotation not found");
  }

  if (quotation.status !== "SUBMITTED") {
    throw new Error(
      "Only SUBMITTED quotations can be selected"
    );
  }

  // Reject other submitted quotations for same PR
  await prisma.quotation.updateMany({
    where: {
      purchaseRequestId: quotation.purchaseRequestId,
      id: {
        not: Number(id),
      },
      status: "SUBMITTED",
    },

    data: {
      status: "REJECTED",
    },
  });

  return prisma.quotation.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "SELECTED",
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
}

/**
 * REJECT QUOTATION
 */
async function rejectQuotation(id, remarks) {
  const quotation = await prisma.quotation.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!quotation) {
    throw new Error("Quotation not found");
  }

  if (
    quotation.status !== "DRAFT" &&
    quotation.status !== "SUBMITTED"
  ) {
    throw new Error(
      "Only DRAFT or SUBMITTED quotations can be rejected"
    );
  }

  return prisma.quotation.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "REJECTED",
      remarks:
        remarks !== undefined
          ? remarks
          : quotation.remarks,
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
}

/**
 * CANCEL QUOTATION
 */
async function cancelQuotation(id) {
  const quotation = await prisma.quotation.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!quotation) {
    throw new Error("Quotation not found");
  }

  if (quotation.status === "SELECTED") {
    throw new Error(
      "Selected quotation cannot be cancelled"
    );
  }

  if (
    quotation.status === "REJECTED" ||
    quotation.status === "CANCELLED"
  ) {
    throw new Error(
      "Quotation is already closed"
    );
  }

  return prisma.quotation.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "CANCELLED",
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