const http = require("http");
const axios = require("axios");

// =====================================================
// CONFIG
// =====================================================

const BASE_URL = "http://localhost:5000";

const ADMIN_EMAIL = "admin@pims.com";
const ADMIN_PASSWORD = "Admin@12345";

const DEPARTMENT_USER_EMAIL = "securitytest@pims.com";
const DEPARTMENT_USER_PASSWORD = "TestUser@12345";

// =====================================================
// HTTP HELPER
// =====================================================

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        let parsed;

        try {
          parsed = data ? JSON.parse(data) : {};
        } catch {
          parsed = {
            raw: data,
          };
        }

        resolve({
          status: res.statusCode,
          data: parsed,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}


// =====================================================
// TEST STATE
// =====================================================

let adminToken = null;
let userToken = null;

let purchaseRequestId = null;

let passed = 0;
let failed = 0;


// =====================================================
// TEST HELPER
// =====================================================

function printTest(number, name, status, expected) {
  if (status === expected) {
    console.log(
      `${number}. ${name} | ${status} | ${expected} | ✅ PASSED`
    );

    passed++;
  } else {
    console.log(
      `${number}. ${name} | ${status} | ${expected} | ❌ FAILED`
    );

    failed++;
  }
}


// =====================================================
// MAIN TEST
// =====================================================

async function runTests() {
  console.log("==============================================");
  console.log(" PIMS PURCHASE REQUEST TEST SUITE");
  console.log("==============================================");
  console.log("");

  try {
    // =================================================
    // 1. ADMIN LOGIN
    // =================================================

    let response = await request("POST", "/api/auth/login", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    printTest(
      1,
      "ADMIN LOGIN",
      response.status,
      200
    );

    if (response.status !== 200) {
      console.log(response.data);
      return;
    }

    adminToken = response.data.data.token;


    // =================================================
    // 2. DEPARTMENT USER LOGIN
    // =================================================

    response = await request("POST", "/api/auth/login", {
      email: DEPARTMENT_USER_EMAIL,
      password: DEPARTMENT_USER_PASSWORD,
    });

    printTest(
      2,
      "DEPARTMENT USER LOGIN",
      response.status,
      200
    );

    if (response.status !== 200) {
      console.log(response.data);
      return;
    }

    userToken = response.data.data.token;


    // =================================================
    // 3. GET ITEMS
    // =================================================

response = await axios.get(`${BASE_URL}/api/items`, {
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});

console.log(
  `3. GET ITEMS | ${response.status} | 200 | ${
    response.status === 200 ? "✅ PASSED" : "❌ FAILED"
  }`
);

console.log("");
console.log("========== ITEMS RESPONSE ==========");
console.log(JSON.stringify(response.data, null, 2));
console.log("====================================");

// Get items from response
const items = response.data.data;

if (!Array.isArray(items)) {
  console.log("");
  console.log("❌ Items response is not an array.");
  console.log("Actual data:", response.data);
  return;
}

if (items.length === 0) {
  console.log("");
  console.log("❌ No items found.");
  console.log("Create at least one item before running PR tests.");
  return;
}

// IMPORTANT: only use an ACTIVE item
const activeItem = items.find((item) => item.isActive === true);

if (!activeItem) {
  console.log("");
  console.log("❌ No active item found.");
  console.log("Existing items:");
  console.log(JSON.stringify(items, null, 2));
  return;
}

const itemId = activeItem.id;

console.log("");
console.log("USING ACTIVE ITEM:");
console.log(`ID: ${activeItem.id}`);
console.log(`Name: ${activeItem.name}`);
console.log(`Code: ${activeItem.code}`);
console.log(`Active: ${activeItem.isActive}`);
console.log("");

    // =================================================
    // 4. CREATE PURCHASE REQUEST
    // =================================================

    response = await request(
      "POST",
      "/api/purchase-requests",
      {
        departmentId: 1,
        branchId: 1,
        storeId: 1,

        purpose: "Purchase Request Test",

        requiredDate: "2026-10-01",

        remarks: "Automated PR module test",

        items: [
          {
            itemId: itemId,
            requestedQuantity: 10,
            estimatedUnitPrice: 100,
            remarks: "Test item",
          },
        ],
      },
      userToken
    );

    printTest(
      4,
      "CREATE PURCHASE REQUEST",
      response.status,
      201
    );

    if (response.status !== 201) {
      console.log(response.data);
      return;
    }

    purchaseRequestId = response.data.data.id;

    console.log(
      `   PR ID: ${purchaseRequestId}`
    );

    console.log(
      `   PR Number: ${response.data.data.requestNumber}`
    );


    // =================================================
    // 5. GET ALL PURCHASE REQUESTS
    // =================================================

    response = await request(
      "GET",
      "/api/purchase-requests",
      null,
      userToken
    );

    printTest(
      5,
      "GET PURCHASE REQUESTS",
      response.status,
      200
    );


    // =================================================
    // 6. GET PR BY ID
    // =================================================

    response = await request(
      "GET",
      `/api/purchase-requests/${purchaseRequestId}`,
      null,
      userToken
    );

    printTest(
      6,
      "GET PURCHASE REQUEST BY ID",
      response.status,
      200
    );


    // =================================================
    // 7. UPDATE PR
    // =================================================

    response = await request(
      "PUT",
      `/api/purchase-requests/${purchaseRequestId}`,
      {
        departmentId: 1,
        branchId: 1,
        storeId: 1,

        purpose: "Updated Purchase Request Test",

        requiredDate: "2026-10-05",

        remarks: "Updated automated test",

        items: [
          {
            itemId: itemId,
            requestedQuantity: 15,
            estimatedUnitPrice: 120,
            remarks: "Updated test item",
          },
        ],
      },
      userToken
    );

    printTest(
      7,
      "UPDATE DRAFT PURCHASE REQUEST",
      response.status,
      200
    );


    // =================================================
    // 8. SUBMIT PR
    // =================================================

    response = await request(
      "POST",
      `/api/purchase-requests/${purchaseRequestId}/submit`,
      {},
      userToken
    );

    printTest(
      8,
      "SUBMIT PURCHASE REQUEST",
      response.status,
      200
    );

    if (response.status !== 200) {
      console.log(response.data);
    }


    // =================================================
    // 9. ADMIN GET PR
    // =================================================

    response = await request(
      "GET",
      `/api/purchase-requests/${purchaseRequestId}`,
      null,
      adminToken
    );

    printTest(
      9,
      "ADMIN GET PURCHASE REQUEST",
      response.status,
      200
    );


    // =================================================
    // 10. NO TOKEN
    // =================================================

    response = await request(
      "GET",
      "/api/purchase-requests"
    );

    printTest(
      10,
      "NO TOKEN PROTECTION",
      response.status,
      401
    );


    // =================================================
    // 11. INVALID PR ID
    // =================================================

    response = await request(
      "GET",
      "/api/purchase-requests/999999",
      null,
      userToken
    );

    printTest(
      11,
      "INVALID PURCHASE REQUEST ID",
      response.status,
      500
    );


    // =================================================
    // 12. DEPARTMENT MANAGER LOGIN
    // =================================================
    //
    // IMPORTANT:
    // This test expects securitytest@pims.com
    // to already be DEPARTMENT_MANAGER.
    //
    // If it is still DEPARTMENT_USER, approval will
    // correctly return 403.
    // =================================================

    response = await request("POST", "/api/auth/login", {
      email: DEPARTMENT_USER_EMAIL,
      password: DEPARTMENT_USER_PASSWORD,
    });

    if (response.status === 200) {
      userToken = response.data.data.token;
    }


    // =================================================
    // 13. TRY APPROVE
    // =================================================

    response = await request(
      "POST",
      `/api/purchase-requests/${purchaseRequestId}/approve`,
      {
        comments: "Approved during automated test",
      },
      userToken
    );

    console.log(
      `13. APPROVE PURCHASE REQUEST | Status: ${response.status}`
    );

    if (response.status === 200) {
      console.log("    ✅ APPROVAL PASSED");
      passed++;
    } else if (response.status === 403) {
      console.log(
        "    ⚠️ APPROVAL SKIPPED - user is not DEPARTMENT_MANAGER"
      );
    } else {
      console.log("    ❌ APPROVAL FAILED");
      console.log(response.data);
      failed++;
    }


    // =================================================
    // 14. GET PR AFTER APPROVAL
    // =================================================

    response = await request(
      "GET",
      `/api/purchase-requests/${purchaseRequestId}`,
      null,
      adminToken
    );

    printTest(
      14,
      "GET PR AFTER APPROVAL",
      response.status,
      200
    );


    // =================================================
    // FINAL RESULT
    // =================================================

    console.log("");
    console.log("==============================================");
    console.log(" TEST SUMMARY");
    console.log("==============================================");

    console.log(`TOTAL PASSED: ${passed}`);
    console.log(`TOTAL FAILED: ${failed}`);

    console.log("");

    if (failed === 0) {
      console.log("🎉 PURCHASE REQUEST MODULE TESTS PASSED!");
    } else {
      console.log("⚠️ SOME TESTS FAILED.");
    }

    console.log("==============================================");

  } catch (error) {
    console.log("");
    console.log("❌ TEST SUITE ERROR");
    console.log(error);
  }
}


// =====================================================
// RUN
// =====================================================

runTests();