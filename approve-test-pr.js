require("dotenv").config();

const prisma = require("./src/config/database");

async function main() {
  const pr = await prisma.purchaseRequest.update({
    where: {
      id: 2,
    },
    data: {
      status: "APPROVED",
    },
  });

  console.log("Purchase Request approved:");
  console.log({
    id: pr.id,
    requestNumber: pr.requestNumber,
    status: pr.status,
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