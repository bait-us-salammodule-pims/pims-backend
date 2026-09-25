require("dotenv").config();

const http = require("http");

const ADMIN_EMAIL = "admin@pims.com";
const ADMIN_PASSWORD = "Admin@12345";

const USER_EMAIL = "securitytest@pims.com";
const USER_PASSWORD = "TestUser@12345";

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data) {
      options.headers["Content-Length"] = Buffer.byteLength(data);
    }

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        let parsedBody;

        try {
          parsedBody = JSON.parse(responseBody);
        } catch {
          parsedBody = responseBody;
        }

        resolve({
          status: res.statusCode,
          body: parsedBody,
        });
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function login(email, password) {
  const response = await request(
    "POST",
    "/api/auth/login",
    {
      email,
      password,
    }
  );

  return response;
}

async function runTests() {
  console.log("\n=================================");
  console.log(" PIMS ORGANIZATION TEST SUITE");
  console.log("=================================\n");

  // --------------------------------
  // 1. ADMIN LOGIN
  // --------------------------------

  console.log("1. ADMIN LOGIN");

  const adminLogin = await login(
    ADMIN_EMAIL,
    ADMIN_PASSWORD
  );

  console.log("Status:", adminLogin.status);

  if (
    adminLogin.status !== 200 ||
    !adminLogin.body.data?.token
  ) {
    console.log("❌ ADMIN LOGIN FAILED");
    console.log(adminLogin.body);
    return;
  }

  const adminToken = adminLogin.body.data.token;

  console.log("✅ ADMIN LOGIN PASSED\n");

  // --------------------------------
  // 2. ADMIN / ME
  // --------------------------------

  console.log("2. ADMIN /ME");

  const adminMe = await request(
    "GET",
    "/api/auth/me",
    null,
    adminToken
  );

  console.log("Status:", adminMe.status);

  if (
    adminMe.status === 200 &&
    adminMe.body.data?.role === "ADMIN"
  ) {
    console.log("✅ ADMIN /ME PASSED\n");
  } else {
    console.log("❌ ADMIN /ME FAILED");
    console.log(adminMe.body);
  }

  // --------------------------------
  // 3. DEPARTMENT GET
  // --------------------------------

  console.log("3. GET DEPARTMENTS");

  const departments = await request(
    "GET",
    "/api/organization/departments",
    null,
    adminToken
  );

  console.log("Status:", departments.status);

  if (departments.status === 200) {
    console.log("✅ GET DEPARTMENTS PASSED");
    console.log(
      "Departments:",
      departments.body.data?.length || 0
    );
    console.log();
  } else {
    console.log("❌ GET DEPARTMENTS FAILED");
    console.log(departments.body);
  }

  // --------------------------------
  // 4. BRANCH GET
  // --------------------------------

  console.log("4. GET BRANCHES");

  const branches = await request(
    "GET",
    "/api/organization/branches",
    null,
    adminToken
  );

  console.log("Status:", branches.status);

  if (branches.status === 200) {
    console.log("✅ GET BRANCHES PASSED");
    console.log(
      "Branches:",
      branches.body.data?.length || 0
    );
    console.log();
  } else {
    console.log("❌ GET BRANCHES FAILED");
    console.log(branches.body);
  }

  // --------------------------------
  // 5. STORE GET
  // --------------------------------

  console.log("5. GET STORES");

  const stores = await request(
    "GET",
    "/api/organization/stores",
    null,
    adminToken
  );

  console.log("Status:", stores.status);

  if (stores.status === 200) {
    console.log("✅ GET STORES PASSED");
    console.log(
      "Stores:",
      stores.body.data?.length || 0
    );
    console.log();
  } else {
    console.log("❌ GET STORES FAILED");
    console.log(stores.body);
  }

  // --------------------------------
  // 6. ADMIN CREATE DUPLICATE DEPARTMENT
  // --------------------------------

  console.log("6. DUPLICATE DEPARTMENT PROTECTION");

  const duplicateDepartment = await request(
    "POST",
    "/api/organization/departments",
    {
      name: "Information Technology",
      code: "IT",
      description: "Duplicate test",
    },
    adminToken
  );

  console.log("Status:", duplicateDepartment.status);

  if (duplicateDepartment.status === 400) {
    console.log("✅ DUPLICATE PROTECTION PASSED\n");
  } else {
    console.log("❌ DUPLICATE PROTECTION FAILED");
    console.log(duplicateDepartment.body);
  }

  // --------------------------------
  // 7. ADMIN CREATE DUPLICATE BRANCH
  // --------------------------------

  console.log("7. DUPLICATE BRANCH PROTECTION");

  const duplicateBranch = await request(
    "POST",
    "/api/organization/branches",
    {
      name: "Karachi Main Branch",
      code: "KHI",
      address: "Duplicate test",
    },
    adminToken
  );

  console.log("Status:", duplicateBranch.status);

  if (duplicateBranch.status === 400) {
    console.log("✅ DUPLICATE BRANCH PROTECTION PASSED\n");
  } else {
    console.log("❌ DUPLICATE BRANCH PROTECTION FAILED");
    console.log(duplicateBranch.body);
  }

  // --------------------------------
  // 8. DEPARTMENT USER LOGIN
  // --------------------------------

  console.log("8. DEPARTMENT USER LOGIN");

  const userLogin = await login(
    USER_EMAIL,
    USER_PASSWORD
  );

  console.log("Status:", userLogin.status);

  if (
    userLogin.status !== 200 ||
    !userLogin.body.data?.token
  ) {
    console.log("❌ DEPARTMENT USER LOGIN FAILED");
    console.log(userLogin.body);
    return;
  }

  const userToken = userLogin.body.data.token;

  console.log("✅ DEPARTMENT USER LOGIN PASSED\n");

  // --------------------------------
  // 9. DEPARTMENT USER /ME
  // --------------------------------

  console.log("9. DEPARTMENT USER /ME");

  const userMe = await request(
    "GET",
    "/api/auth/me",
    null,
    userToken
  );

  console.log("Status:", userMe.status);

  if (
    userMe.status === 200 &&
    userMe.body.data?.role === "DEPARTMENT_USER"
  ) {
    console.log("✅ DEPARTMENT USER /ME PASSED\n");
  } else {
    console.log("❌ DEPARTMENT USER /ME FAILED");
    console.log(userMe.body);
  }

  // --------------------------------
  // 10. DEPARTMENT USER ADMIN ROUTE
  // --------------------------------

  console.log("10. DEPARTMENT USER → ADMIN TEST");

  const adminRoute = await request(
    "GET",
    "/api/auth/admin-test",
    null,
    userToken
  );

  console.log("Status:", adminRoute.status);

  if (adminRoute.status === 403) {
    console.log("✅ ROLE AUTHORIZATION PASSED\n");
  } else {
    console.log("❌ ROLE AUTHORIZATION FAILED");
    console.log(adminRoute.body);
  }

  // --------------------------------
  // 11. DEPARTMENT USER ORGANIZATION ACCESS
  // --------------------------------

  console.log("11. DEPARTMENT USER → ORGANIZATION ACCESS");

  const unauthorizedOrganization = await request(
    "GET",
    "/api/organization/departments",
    null,
    userToken
  );

  console.log("Status:", unauthorizedOrganization.status);

  if (unauthorizedOrganization.status === 403) {
    console.log("✅ ORGANIZATION AUTHORIZATION PASSED\n");
  } else {
    console.log("❌ ORGANIZATION AUTHORIZATION FAILED");
    console.log(unauthorizedOrganization.body);
  }

  // --------------------------------
  // 12. NO TOKEN TEST
  // --------------------------------

  console.log("12. NO TOKEN TEST");

  const noToken = await request(
    "GET",
    "/api/organization/departments"
  );

  console.log("Status:", noToken.status);

  if (noToken.status === 401) {
    console.log("✅ AUTHENTICATION PROTECTION PASSED\n");
  } else {
    console.log("❌ AUTHENTICATION PROTECTION FAILED");
    console.log(noToken.body);
  }

  // --------------------------------
  // FINAL
  // --------------------------------

  console.log("=================================");
  console.log(" TEST SUITE COMPLETED");
  console.log("=================================\n");
}

runTests().catch((error) => {
  console.error("\n❌ TEST SUITE ERROR");
  console.error(error.message);
});