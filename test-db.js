require("dotenv").config();

const prisma = require("./src/config/database");

async function testDatabase() {
  try {
    await prisma.$connect();
    console.log("DATABASE CONNECTED SUCCESSFULLY");
  } catch (error) {
    console.error("DATABASE CONNECTION FAILED");
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();