const prisma = require("../config/database");

const createVendor = async ({
  name,
  code,
  contactPerson,
  email,
  phone,
  address,
  description,
}) => {
  const existingVendor = await prisma.vendor.findFirst({
    where: {
      OR: [
        { name },
        { code },
      ],
    },
  });

  if (existingVendor) {
    throw new Error("Vendor with this name or code already exists");
  }

  return prisma.vendor.create({
    data: {
      name,
      code,
      contactPerson: contactPerson || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      description: description || null,
    },
  });
};

const getVendors = async () => {
  return prisma.vendor.findMany({
    orderBy: {
      name: "asc",
    },
  });
};

const getVendorById = async (id) => {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id,
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  return vendor;
};

const updateVendor = async (
  id,
  {
    name,
    code,
    contactPerson,
    email,
    phone,
    address,
    description,
  }
) => {
  const existingVendor = await prisma.vendor.findUnique({
    where: {
      id,
    },
  });

  if (!existingVendor) {
    throw new Error("Vendor not found");
  }

  if (code && code !== existingVendor.code) {
    const duplicateCode = await prisma.vendor.findUnique({
      where: {
        code,
      },
    });

    if (duplicateCode) {
      throw new Error("Vendor with this code already exists");
    }
  }

  if (name && name !== existingVendor.name) {
    const duplicateName = await prisma.vendor.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
    });

    if (duplicateName) {
      throw new Error("Vendor with this name already exists");
    }
  }

  return prisma.vendor.update({
    where: {
      id,
    },
    data: {
      name: name ?? existingVendor.name,
      code: code ?? existingVendor.code,
      contactPerson:
        contactPerson !== undefined
          ? contactPerson
          : existingVendor.contactPerson,
      email:
        email !== undefined
          ? email
          : existingVendor.email,
      phone:
        phone !== undefined
          ? phone
          : existingVendor.phone,
      address:
        address !== undefined
          ? address
          : existingVendor.address,
      description:
        description !== undefined
          ? description
          : existingVendor.description,
    },
  });
};

const deactivateVendor = async (id) => {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id,
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  if (!vendor.isActive) {
    throw new Error("Vendor is already inactive");
  }

  return prisma.vendor.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
};

module.exports = {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deactivateVendor,
};