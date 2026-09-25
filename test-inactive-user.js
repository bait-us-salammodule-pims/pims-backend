require("dotenv").config();

const prisma = require("./src/config/database");

async function activateUser() {
  try {
    const user = await prisma.user.update({
      where: {
        email: "securitytest@pims.com",
      },
      data: {
        isActive: true,
      },
    });

    console.log("User activated successfully");
    console.log({
      id: user.id,
      email: user.email,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Failed to activate user");
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

activateUser();