const prisma = require("../config/database");

// ==============================
// ITEM CATEGORY
// ==============================

const createCategory = async ({
  name,
  code,
  description,
}) => {
  const existingCategory = await prisma.itemCategory.findFirst({
    where: {
      OR: [
        { name },
        { code },
      ],
    },
  });

  if (existingCategory) {
    throw new Error(
      "Item category with this name or code already exists"
    );
  }

  return prisma.itemCategory.create({
    data: {
      name,
      code,
      description: description || null,
    },
  });
};

const getCategories = async () => {
  return prisma.itemCategory.findMany({
    include: {
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
};

// ==============================
// ITEMS
// ==============================

const createItem = async ({
  name,
  code,
  description,
  unit,
  reorderLevel,
  categoryId,
}) => {
  const existingItem = await prisma.item.findUnique({
    where: {
      code,
    },
  });

  if (existingItem) {
    throw new Error("Item with this code already exists");
  }

  const category = await prisma.itemCategory.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw new Error("Item category not found");
  }

  if (!category.isActive) {
    throw new Error(
      "Cannot create item under an inactive category"
    );
  }

  return prisma.item.create({
    data: {
      name,
      code,
      description: description || null,
      unit,
      reorderLevel,
      categoryId,
    },
    include: {
      category: true,
    },
  });
};

const getItems = async () => {
  return prisma.item.findMany({
    include: {
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

const getItemById = async (id) => {
  const item = await prisma.item.findUnique({
    where: {
      id,
    },
    include: {
      category: true,
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  return item;
};

const updateItem = async (
  id,
  {
    name,
    code,
    description,
    unit,
    reorderLevel,
    categoryId,
  }
) => {
  const existingItem = await prisma.item.findUnique({
    where: {
      id,
    },
  });

  if (!existingItem) {
    throw new Error("Item not found");
  }

  const duplicateItem = await prisma.item.findFirst({
    where: {
      code,
      NOT: {
        id,
      },
    },
  });

  if (duplicateItem) {
    throw new Error("Another item with this code already exists");
  }

  const category = await prisma.itemCategory.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw new Error("Item category not found");
  }

  if (!category.isActive) {
    throw new Error(
      "Cannot assign item to an inactive category"
    );
  }

  return prisma.item.update({
    where: {
      id,
    },
    data: {
      name,
      code,
      description: description || null,
      unit,
      reorderLevel,
      categoryId,
    },
    include: {
      category: true,
    },
  });
};

const deactivateItem = async (id) => {
  const item = await prisma.item.findUnique({
    where: {
      id,
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  return prisma.item.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
    include: {
      category: true,
    },
  });
};

module.exports = {
  createCategory,
  getCategories,
  createItem,
  getItems,
  getItemById,
  updateItem,
  deactivateItem,
};