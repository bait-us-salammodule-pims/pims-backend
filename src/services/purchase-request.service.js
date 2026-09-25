const prisma = require("../config/database");

// =====================================================
// CREATE PURCHASE REQUEST
// =====================================================

const createPurchaseRequest = async (userId, data) => {
  const {
    departmentId,
    branchId,
    storeId,
    purpose,
    requiredDate,
    remarks,
    items,
  } = data;

  // Validate requester
  const requester = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!requester || !requester.isActive) {
    throw new Error("Invalid or inactive user");
  }

  // Validate department
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department || !department.isActive) {
    throw new Error("Invalid or inactive department");
  }

  // Validate branch
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!branch || !branch.isActive) {
    throw new Error("Invalid or inactive branch");
  }

  // Validate store
  if (storeId) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store || !store.isActive) {
      throw new Error("Invalid or inactive store");
    }

    if (store.branchId !== branchId) {
      throw new Error("Store does not belong to selected branch");
    }
  }

  // Validate items
  for (const requestItem of items) {
    const item = await prisma.item.findUnique({
      where: { id: Number(requestItem.itemId) },
    });

    if (!item || !item.isActive) {
      throw new Error(
        `Invalid or inactive item: ${requestItem.itemId}`
      );
    }

    if (
      !Number.isInteger(Number(requestItem.requestedQuantity)) ||
      Number(requestItem.requestedQuantity) <= 0
    ) {
      throw new Error("Requested quantity must be greater than 0");
    }
  }

  // Generate request number
  const year = new Date().getFullYear();

  const count = await prisma.purchaseRequest.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
    },
  });

  const requestNumber = `PR-${year}-${String(count + 1).padStart(
    5,
    "0"
  )}`;

  // Create PR + items
  const purchaseRequest = await prisma.purchaseRequest.create({
    data: {
      requestNumber,
      requestedById: userId,
      departmentId,
      branchId,
      storeId: storeId || null,
      purpose,
      requiredDate: requiredDate ? new Date(requiredDate) : null,
      remarks,
      status: "DRAFT",

      items: {
        create: items.map((item) => ({
          itemId: Number(item.itemId),
          requestedQuantity: Number(item.requestedQuantity),
          estimatedUnitPrice:
            item.estimatedUnitPrice !== undefined &&
            item.estimatedUnitPrice !== null
              ? Number(item.estimatedUnitPrice)
              : null,
          remarks: item.remarks || null,
        })),
      },
    },

    include: {
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      department: true,
      branch: true,
      store: true,

      items: {
        include: {
          item: true,
        },
      },

      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  return purchaseRequest;
};

// =====================================================
// GET ALL PURCHASE REQUESTS
// =====================================================

const getPurchaseRequests = async (user) => {
  const where = {};

  // Department user → own requests only
  if (user.role === "DEPARTMENT_USER") {
    where.requestedById = user.userId;
  }

  // Department manager → department requests
  if (user.role === "DEPARTMENT_MANAGER") {
    if (!user.departmentId) {
      throw new Error("Manager is not assigned to a department");
    }

    where.departmentId = user.departmentId;
  }

  const requests = await prisma.purchaseRequest.findMany({
    where,

    include: {
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      department: true,
      branch: true,
      store: true,

      items: {
        include: {
          item: true,
        },
      },

      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return requests;
};

// =====================================================
// GET PURCHASE REQUEST BY ID
// =====================================================

const getPurchaseRequestById = async (id, user) => {
  const purchaseRequest = await prisma.purchaseRequest.findUnique({
    where: { id },

    include: {
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      department: true,
      branch: true,
      store: true,

      items: {
        include: {
          item: true,
        },
      },

      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!purchaseRequest) {
    throw new Error("Purchase request not found");
  }

  // Department user → own PR only
  if (
    user.role === "DEPARTMENT_USER" &&
    purchaseRequest.requestedById !== user.userId
  ) {
    throw new Error(
      "You are not authorized to view this purchase request"
    );
  }

  // Department manager → own department only
  if (
    user.role === "DEPARTMENT_MANAGER" &&
    purchaseRequest.departmentId !== user.departmentId
  ) {
    throw new Error(
      "You are not authorized to view this purchase request"
    );
  }

  return purchaseRequest;
};

// =====================================================
// UPDATE DRAFT PURCHASE REQUEST
// =====================================================

const updatePurchaseRequest = async (id, user, data) => {
  const existing = await prisma.purchaseRequest.findUnique({
    where: { id },

    include: {
      items: true,
    },
  });

  if (!existing) {
    throw new Error("Purchase request not found");
  }

  // Only draft can be updated
  if (existing.status !== "DRAFT") {
    throw new Error(
      "Only draft purchase requests can be updated"
    );
  }

  // Department user → own PR only
  if (
    user.role === "DEPARTMENT_USER" &&
    existing.requestedById !== user.userId
  ) {
    throw new Error(
      "You are not authorized to update this purchase request"
    );
  }

  const {
    departmentId,
    branchId,
    storeId,
    purpose,
    requiredDate,
    remarks,
    items,
  } = data;

  // Validate department
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department || !department.isActive) {
    throw new Error("Invalid or inactive department");
  }

  // Validate branch
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!branch || !branch.isActive) {
    throw new Error("Invalid or inactive branch");
  }

  // Validate store
  if (storeId) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store || !store.isActive) {
      throw new Error("Invalid or inactive store");
    }

    if (store.branchId !== branchId) {
      throw new Error("Store does not belong to selected branch");
    }
  }

  // Validate items if provided
  if (items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("At least one item is required");
    }

    for (const requestItem of items) {
      const item = await prisma.item.findUnique({
        where: {
          id: Number(requestItem.itemId),
        },
      });

      if (!item || !item.isActive) {
        throw new Error(
          `Invalid or inactive item: ${requestItem.itemId}`
        );
      }

      if (
        !Number.isInteger(Number(requestItem.requestedQuantity)) ||
        Number(requestItem.requestedQuantity) <= 0
      ) {
        throw new Error(
          "Requested quantity must be greater than 0"
        );
      }
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.purchaseRequest.update({
      where: { id },

      data: {
        departmentId,
        branchId,
        storeId: storeId || null,
        purpose,
        requiredDate: requiredDate
          ? new Date(requiredDate)
          : null,
        remarks,
      },
    });

    // Replace items
    if (items) {
      await tx.purchaseRequestItem.deleteMany({
        where: {
          purchaseRequestId: id,
        },
      });

      await tx.purchaseRequestItem.createMany({
        data: items.map((item) => ({
          purchaseRequestId: id,
          itemId: Number(item.itemId),
          requestedQuantity: Number(item.requestedQuantity),
          estimatedUnitPrice:
            item.estimatedUnitPrice !== undefined &&
            item.estimatedUnitPrice !== null
              ? Number(item.estimatedUnitPrice)
              : null,
          remarks: item.remarks || null,
        })),
      });
    }

    return tx.purchaseRequest.findUnique({
      where: { id },

      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        department: true,
        branch: true,
        store: true,

        items: {
          include: {
            item: true,
          },
        },

        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  });

  return updated;
};

// =====================================================
// SUBMIT PURCHASE REQUEST
// =====================================================

const submitPurchaseRequest = async (id, user) => {
  const purchaseRequest = await prisma.purchaseRequest.findUnique({
    where: { id },

    include: {
      items: true,
    },
  });

  if (!purchaseRequest) {
    throw new Error("Purchase request not found");
  }

  // Only requester can submit
  if (purchaseRequest.requestedById !== user.userId) {
    throw new Error(
      "You are not authorized to submit this request"
    );
  }

  // Only draft can be submitted
  if (purchaseRequest.status !== "DRAFT") {
    throw new Error(
      "Only draft purchase requests can be submitted"
    );
  }

  if (purchaseRequest.items.length === 0) {
    throw new Error(
      "Purchase request must contain at least one item"
    );
  }

  // Find department manager
  const manager = await prisma.user.findFirst({
    where: {
      departmentId: purchaseRequest.departmentId,
      role: "DEPARTMENT_MANAGER",
      isActive: true,
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.purchaseRequest.update({
      where: { id },

      data: {
        status: manager ? "UNDER_REVIEW" : "SUBMITTED",
      },
    });

    // Create approval request
    if (manager) {
      await tx.purchaseRequestApproval.create({
        data: {
          purchaseRequestId: id,
          approverId: manager.id,
          status: "PENDING",
        },
      });
    }

    return updatedRequest;
  });

  return result;
};

// =====================================================
// APPROVE PURCHASE REQUEST
// =====================================================

const approvePurchaseRequest = async (id, user, comments) => {
  const purchaseRequest = await prisma.purchaseRequest.findUnique({
    where: { id },
  });

  if (!purchaseRequest) {
    throw new Error("Purchase request not found");
  }

  if (purchaseRequest.status !== "UNDER_REVIEW") {
    throw new Error(
      "Purchase request is not under review"
    );
  }

  if (
    user.role !== "ADMIN" &&
    user.role !== "DEPARTMENT_MANAGER"
  ) {
    throw new Error(
      "You are not authorized to approve this request"
    );
  }

  if (
    user.role === "DEPARTMENT_MANAGER" &&
    user.departmentId !== purchaseRequest.departmentId
  ) {
    throw new Error(
      "You cannot approve another department's request"
    );
  }

  const approval = await prisma.purchaseRequestApproval.findFirst({
    where: {
      purchaseRequestId: id,
      approverId: user.userId,
      status: "PENDING",
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    if (approval) {
      await tx.purchaseRequestApproval.update({
        where: {
          id: approval.id,
        },

        data: {
          status: "APPROVED",
          comments: comments || null,
          actionAt: new Date(),
        },
      });
    } else {
      await tx.purchaseRequestApproval.create({
        data: {
          purchaseRequestId: id,
          approverId: user.userId,
          status: "APPROVED",
          comments: comments || null,
          actionAt: new Date(),
        },
      });
    }

    return tx.purchaseRequest.update({
      where: { id },

      data: {
        status: "APPROVED",
      },
    });
  });

  return result;
};

// =====================================================
// REJECT PURCHASE REQUEST
// =====================================================

const rejectPurchaseRequest = async (id, user, comments) => {
  const purchaseRequest = await prisma.purchaseRequest.findUnique({
    where: { id },
  });

  if (!purchaseRequest) {
    throw new Error("Purchase request not found");
  }

  if (purchaseRequest.status !== "UNDER_REVIEW") {
    throw new Error(
      "Purchase request is not under review"
    );
  }

  if (
    user.role !== "ADMIN" &&
    user.role !== "DEPARTMENT_MANAGER"
  ) {
    throw new Error(
      "You are not authorized to reject this request"
    );
  }

  if (
    user.role === "DEPARTMENT_MANAGER" &&
    user.departmentId !== purchaseRequest.departmentId
  ) {
    throw new Error(
      "You cannot reject another department's request"
    );
  }

  const approval = await prisma.purchaseRequestApproval.findFirst({
    where: {
      purchaseRequestId: id,
      approverId: user.userId,
      status: "PENDING",
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    if (approval) {
      await tx.purchaseRequestApproval.update({
        where: {
          id: approval.id,
        },

        data: {
          status: "REJECTED",
          comments: comments || null,
          actionAt: new Date(),
        },
      });
    } else {
      await tx.purchaseRequestApproval.create({
        data: {
          purchaseRequestId: id,
          approverId: user.userId,
          status: "REJECTED",
          comments: comments || null,
          actionAt: new Date(),
        },
      });
    }

    return tx.purchaseRequest.update({
      where: { id },

      data: {
        status: "REJECTED", 
      },
    });
  });

  return result;
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createPurchaseRequest,
  getPurchaseRequests,
  getPurchaseRequestById,
  updatePurchaseRequest,
  submitPurchaseRequest,
  approvePurchaseRequest,
  rejectPurchaseRequest,
};