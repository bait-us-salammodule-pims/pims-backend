const http = require("http");

const BASE_URL = "http://localhost:5000";

let token = "";
let vendorId = null;

const request = (method, path, body = null, authToken = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (authToken) {
      options.headers.Authorization = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        let parsedData;

        try {
          parsedData = JSON.parse(data);
        } catch {
          parsedData = data;
        }

        resolve({
          status: res.statusCode,
          data: parsedData,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

const runTests = async () => {
  console.log("=================================");
  console.log(" PIMS VENDOR MANAGEMENT TEST SUITE");
  console.log("=================================\n");

  // 1. ADMIN LOGIN
  console.log("1. ADMIN LOGIN");

  const loginResponse = await request(
    "POST",
    "/api/auth/login",
    {
      email: "admin@pims.com",
      password: "Admin@12345",
    }
  );

  console.log("Status:", loginResponse.status);

  if (
    loginResponse.status === 200 &&
    loginResponse.data.success
  ) {
    token = loginResponse.data.data.token;
    console.log("✅ ADMIN LOGIN PASSED\n");
  } else {
    console.log("❌ ADMIN LOGIN FAILED");
    console.log("Response:", loginResponse.data);
    return;
  }

  // 2. CREATE VENDOR
  console.log("2. CREATE VENDOR");

  const createResponse = await request(
    "POST",
    "/api/vendors",
    {
      name: "ABC Supplies",
      code: "ABC001",
      contactPerson: "Ali Khan",
      email: "ali@abcsupplies.com",
      phone: "03001234567",
      address: "Karachi",
      description: "Test vendor",
    },
    token
  );

  console.log("Status:", createResponse.status);

  if (
    createResponse.status === 201 &&
    createResponse.data.success
  ) {
    vendorId = createResponse.data.data.id;
    console.log("Vendor ID:", vendorId);
    console.log("✅ CREATE VENDOR PASSED\n");
  } else {
    console.log("❌ CREATE VENDOR FAILED");
    console.log("Response:", createResponse.data);
  }

  // 3. GET VENDORS
  console.log("3. GET VENDORS");

  const getResponse = await request(
    "GET",
    "/api/vendors",
    null,
    token
  );

  console.log("Status:", getResponse.status);

  if (
    getResponse.status === 200 &&
    getResponse.data.success
  ) {
    console.log(
      "Vendors:",
      getResponse.data.data.length
    );
    console.log("✅ GET VENDORS PASSED\n");
  } else {
    console.log("❌ GET VENDORS FAILED");
    console.log("Response:", getResponse.data);
  }

  // 4. GET VENDOR BY ID
  console.log("4. GET VENDOR BY ID");

  const getByIdResponse = await request(
    "GET",
    `/api/vendors/${vendorId}`,
    null,
    token
  );

  console.log("Status:", getByIdResponse.status);

  if (
    getByIdResponse.status === 200 &&
    getByIdResponse.data.success
  ) {
    console.log("✅ GET VENDOR BY ID PASSED\n");
  } else {
    console.log("❌ GET VENDOR BY ID FAILED");
    console.log("Response:", getByIdResponse.data);
  }

  // 5. DUPLICATE VENDOR PROTECTION
  console.log("5. DUPLICATE VENDOR PROTECTION");

  const duplicateResponse = await request(
    "POST",
    "/api/vendors",
    {
      name: "ABC Supplies",
      code: "ABC001",
      contactPerson: "Duplicate Test",
    },
    token
  );

  console.log("Status:", duplicateResponse.status);

  if (duplicateResponse.status === 400) {
    console.log("✅ DUPLICATE VENDOR PROTECTION PASSED\n");
  } else {
    console.log("❌ DUPLICATE VENDOR PROTECTION FAILED");
    console.log("Response:", duplicateResponse.data);
  }

  // 6. UPDATE VENDOR
  console.log("6. UPDATE VENDOR");

  const updateResponse = await request(
    "PUT",
    `/api/vendors/${vendorId}`,
    {
      name: "ABC Supplies Updated",
      phone: "03111234567",
      description: "Updated vendor",
    },
    token
  );

  console.log("Status:", updateResponse.status);

  if (
    updateResponse.status === 200 &&
    updateResponse.data.success
  ) {
    console.log("✅ UPDATE VENDOR PASSED\n");
  } else {
    console.log("❌ UPDATE VENDOR FAILED");
    console.log("Response:", updateResponse.data);
  }

  // 7. INVALID VENDOR ID
  console.log("7. INVALID VENDOR ID");

  const invalidIdResponse = await request(
    "GET",
    "/api/vendors/999999",
    null,
    token
  );

  console.log("Status:", invalidIdResponse.status);

  if (invalidIdResponse.status === 404) {
    console.log("✅ INVALID VENDOR ID PROTECTION PASSED\n");
  } else {
    console.log("❌ INVALID VENDOR ID TEST FAILED");
    console.log("Response:", invalidIdResponse.data);
  }

  // 8. DEACTIVATE VENDOR
  console.log("8. DEACTIVATE VENDOR");

  const deactivateResponse = await request(
    "PATCH",
    `/api/vendors/${vendorId}/deactivate`,
    null,
    token
  );

  console.log("Status:", deactivateResponse.status);

  if (
    deactivateResponse.status === 200 &&
    deactivateResponse.data.success
  ) {
    console.log("✅ DEACTIVATE VENDOR PASSED\n");
  } else {
    console.log("❌ DEACTIVATE VENDOR FAILED");
    console.log("Response:", deactivateResponse.data);
  }

  // 9. NO TOKEN TEST
  console.log("9. NO TOKEN TEST");

  const noTokenResponse = await request(
    "GET",
    "/api/vendors"
  );

  console.log("Status:", noTokenResponse.status);

  if (noTokenResponse.status === 401) {
    console.log("✅ AUTHENTICATION PROTECTION PASSED\n");
  } else {
    console.log("❌ AUTHENTICATION PROTECTION FAILED");
    console.log("Response:", noTokenResponse.data);
  }

  console.log("=================================");
  console.log(" VENDOR TEST SUITE COMPLETED");
  console.log("=================================");
};

runTests().catch((error) => {
  console.error("TEST SUITE ERROR:", error);
});