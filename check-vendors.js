require("dotenv").config();

const prisma = require("./src/config/database");

async function main() {
  const vendors = await prisma.vendor.findMany({
    orderBy: {
      id: "asc",
    },
  });

  console.log(JSON.stringify(vendors, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });