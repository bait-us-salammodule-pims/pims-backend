
const BASE_URL = "http://localhost:5000/api";

let token = "";
let purchaseRequestId = null;
let quotationId = null;
let purchaseOrderId = null;
let grnId = null;

async function request(method, url, body = null, auth = true) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return {
    status: response.status,
    data,
  };
}

function check(step, actual, expected) {
  const passed = actual === expected;

  console.log(
    `${step} | ${actual} | ${expected} | ${
      passed ? "✅ PASSED" : "❌ FAILED"
    }`
  );

  if (!passed) {
    console.log("Response:", JSON.stringify(actual, null, 2));
  }

  return passed;
}

async function run() {
  let passed = 0;
  let failed = 0;

  console.log("\n==============================================");
  console.log(" PIMS FINAL BACKEND INTEGRATION TEST");
  console.log("==============================================\n");

  // =====================================================
  // 1. LOGIN
  // =====================================================

  let res = await request(
    "POST",
    "/auth/login",
    {
      email: "admin@pims.com",
      password: "Admin@12345",
    },
    false
  );

  if (check("1. ADMIN LOGIN", res.status, 200)) passed++;
  else failed++;

  token = res.data?.data?.token;

  if (!token) {
    console.log("\n❌ Token missing. Stopping test.");
    return;
  }

  // =====================================================
  // 2. HEALTH
  // =====================================================

  res = await fetch("http://localhost:5000/health");
  const health = await res.json();

  if (check("2. SERVER HEALTH", res.status, 200)) passed++;
  else failed++;

  // =====================================================
  // 3. ORGANIZATION
  // =====================================================

  res = await request("GET", "/organization/departments");

  if (check("3. GET DEPARTMENTS", res.status, 200)) passed++;
  else failed++;

  res = await request("GET", "/organization/branches");

  if (check("4. GET BRANCHES", res.status, 200)) passed++;
  else failed++;

  res = await request("GET", "/organization/stores");

  if (check("5. GET STORES", res.status, 200)) passed++;
  else failed++;

  // =====================================================
  // 4. ITEMS
  // =====================================================

  res = await request("GET", "/items");

  if (check("6. GET ITEMS", res.status, 200)) passed++;
  else failed++;

  // =====================================================
  // 5. VENDORS
  // =====================================================

  res = await request("GET", "/vendors");

  if (check("7. GET VENDORS", res.status, 200)) passed++;
  else failed++;

  // =====================================================
  // 6. PURCHASE REQUESTS
  // =====================================================

  res = await request("GET", "/purchase-requests");

  if (check("8. GET PURCHASE REQUESTS", res.status, 200)) passed++;
  else failed++;

  if (res.data?.data?.length > 0) {
    purchaseRequestId = res.data.data[0].id;
  }

  // =====================================================
  // 7. QUOTATIONS
  // =====================================================

  res = await request("GET", "/quotations");

  if (check("9. GET QUOTATIONS", res.status, 200)) passed++;
  else failed++;

  if (res.data?.data?.length > 0) {
    quotationId = res.data.data[0].id;
  }

  // =====================================================
  // 8. PURCHASE ORDERS
  // =====================================================

  res = await request("GET", "/purchase-orders");

  if (check("10. GET PURCHASE ORDERS", res.status, 200)) passed++;
  else failed++;

  if (res.data?.data?.length > 0) {
    purchaseOrderId = res.data.data[0].id;
  }

  // =====================================================
  // 9. GRN
  // =====================================================

  res = await request("GET", "/grns");

  if (check("11. GET GRNs", res.status, 200)) passed++;
  else failed++;

  if (res.data?.data?.length > 0) {
    grnId = res.data.data[0].id;
  }

  // =====================================================
  // 10. INVENTORY
  // =====================================================

  res = await request("GET", "/inventory/stock");

  if (check("12. GET STOCK", res.status, 200)) passed++;
  else failed++;

  res = await request("GET", "/inventory/ledger");

  if (check("13. GET INVENTORY LEDGER", res.status, 200)) passed++;
  else failed++;

  // =====================================================
  // 11. STOCK TRANSFERS
  // =====================================================

  res = await request("GET", "/stock-transfers");

  if (check("14. GET STOCK TRANSFERS", res.status, 200)) passed++;
  else failed++;

  // =====================================================
  // 12. AUTH PROTECTION
  // =====================================================

  res = await request(
    "GET",
    "/organization/stores",
    null,
    false
  );

  if (check("15. NO TOKEN PROTECTION", res.status, 401)) passed++;
  else failed++;

  // =====================================================
  // FINAL SUMMARY
  // =====================================================

  console.log("\n==============================================");
  console.log(" FINAL INTEGRATION TEST COMPLETE");
  console.log("==============================================");

  console.log(`\nTOTAL PASSED: ${passed}`);
  console.log(`TOTAL FAILED: ${failed}`);

  if (failed === 0) {
    console.log("\n🎉 ALL FINAL INTEGRATION TESTS PASSED!");
    console.log("PIMS BACKEND IS READY FOR DEMO.");
  } else {
    console.log("\n⚠️ SOME TESTS FAILED.");
    console.log("Check the failed endpoint responses above.");
  }

  console.log("\n==============================================\n");
}

run().catch((error) => {
  console.error("\n❌ TEST ERROR:");
  console.error(error);
});
