require("dotenv").config();

const prisma = require("./src/config/database");

async function main() {
  const vendor = await prisma.vendor.update({
    where: {
      id: 1,
    },
    data: {
      isActive: true,
    },
  });

  console.log("Vendor activated:");
  console.log({
    id: vendor.id,
    name: vendor.name,
    code: vendor.code,
    isActive: vendor.isActive,
  });
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });