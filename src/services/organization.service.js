const prisma = require("../config/database");

const createDepartment = async ({
  name,
  code,
  description,
}) => {
  const existingDepartment = await prisma.department.findFirst({
    where: {
      OR: [
        { name },
        { code },
      ],
    },
  });

  if (existingDepartment) {
    throw new Error("Department with this name or code already exists");
  }

  return prisma.department.create({
    data: {
      name,
      code,
      description: description || null,
    },
  });
};

const getDepartments = async () => {
  return prisma.department.findMany({
    orderBy: {
      name: "asc",
    },
  });
};

const createBranch = async ({
  name,
  code,
  address,
  description,
}) => {
  const existingBranch = await prisma.branch.findFirst({
    where: {
      OR: [
        { name },
        { code },
      ],
    },
  });

  if (existingBranch) {
    throw new Error("Branch with this name or code already exists");
  }

  return prisma.branch.create({
    data: {
      name,
      code,
      address: address || null,
      description: description || null,
    },
  });
};

const getBranches = async () => {
  return prisma.branch.findMany({
    include: {
      stores: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

const createStore = async ({
  name,
  code,
  branchId,
  description,
}) => {
  const branch = await prisma.branch.findUnique({
    where: {
      id: branchId,
    },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  if (!branch.isActive) {
    throw new Error("Cannot create store under an inactive branch");
  }

  const existingStore = await prisma.store.findUnique({
    where: {
      code,
    },
  });

  if (existingStore) {
    throw new Error("Store with this code already exists");
  }

  return prisma.store.create({
    data: {
      name,
      code,
      branchId,
      description: description || null,
    },
  });
};

const getStores = async () => {
  return prisma.store.findMany({
    include: {
      branch: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

module.exports = {
  createDepartment,
  getDepartments,
  createBranch,
  getBranches,
  createStore,
  getStores,
};