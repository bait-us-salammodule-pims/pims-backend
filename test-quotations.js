require("dotenv").config();

const BASE_URL = "http://localhost:5000/api";

let adminToken = "";
let quotationId = null;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return {
    status: response.status,
    data,
  };
}

async function login() {
  const result = await request(`${BASE_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email: "admin@pims.com",
      password: "Admin@12345",
    }),
  });

  console.log(
    `1. ADMIN LOGIN | ${result.status} | 200 | ${
      result.status === 200 ? "✅ PASSED" : "❌ FAILED"
    }`
  );

  if (result.status !== 200) {
    console.log(result.data);
    process.exit(1);
  }

  adminToken = result.data.data.token;
}

async function getApprovedPR() {
  const result = await request(`${BASE_URL}/purchase-requests`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  console.log(
    `2. GET PURCHASE REQUESTS | ${result.status} | 200 | ${
      result.status === 200 ? "✅ PASSED" : "❌ FAILED"
    }`
  );

  if (result.status !== 200) {
    console.log(result.data);
    process.exit(1);
  }

  const requests =
    result.data.data?.purchaseRequests ||
    result.data.data ||
    [];

  const approvedPR = requests.find(
    (pr) => pr.status === "APPROVED"
  );

  if (!approvedPR) {
    console.log("❌ No APPROVED Purchase Request found.");
    process.exit(1);
  }

  console.log(`USING APPROVED PR: ${approvedPR.requestNumber}`);

  // IMPORTANT:
  // Get complete PR details so we use its REAL items.
  const detail = await request(
    `${BASE_URL}/purchase-requests/${approvedPR.id}`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );

  if (detail.status !== 200) {
    console.log("❌ Could not get PR details.");
    console.log(detail.data);
    process.exit(1);
  }

  return detail.data.data;
}

async function getActiveVendor() {
  const result = await request(`${BASE_URL}/vendors`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (result.status !== 200) {
    console.log("❌ Could not get vendors.");
    console.log(result.data);
    process.exit(1);
  }

  const vendors =
    result.data.data?.vendors ||
    result.data.data ||
    [];

  const vendor = vendors.find((v) => v.isActive === true);

  if (!vendor) {
    console.log("❌ No active vendor found.");
    process.exit(1);
  }

  console.log(`USING VENDOR: ${vendor.name}`);

  return vendor;
}

async function createQuotation(pr) {
  if (!pr.items || pr.items.length === 0) {
    console.log("❌ Approved PR has no items.");
    process.exit(1);
  }

  console.log("\nPR ITEMS BEING USED:");

  pr.items.forEach((item) => {
    console.log({
      itemId: item.itemId,
      itemName: item.item?.name,
      requestedQuantity: item.requestedQuantity,
    });
  });

  // Build quotation items directly from PR items.
  // This avoids quantity/item mismatch.
  const quotationItems = pr.items.map((item) => ({
    itemId: item.itemId,
    quantity: item.requestedQuantity,
    unitPrice: 100,
    remarks: "Test quotation item",
  }));

  const vendor = await getActiveVendor();

  const payload = {
    purchaseRequestId: pr.id,
    vendorId: vendor.id,
    quotationDate: new Date().toISOString(),
    validUntil: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    remarks: "Test quotation",
    items: quotationItems,
  };

  console.log("\nCREATE QUOTATION PAYLOAD:");
  console.log(JSON.stringify(payload, null, 2));

  const result = await request(`${BASE_URL}/quotations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(payload),
  });

  console.log(
    `\n3. CREATE QUOTATION | ${result.status} | 201 | ${
      result.status === 201 ? "✅ PASSED" : "❌ FAILED"
    }`
  );

  if (result.status !== 201) {
    console.log("\n❌ SERVER ERROR RESPONSE:");
    console.log(JSON.stringify(result.data, null, 2));
    process.exit(1);
  }

  const quotation = result.data.data;

  quotationId = quotation.id;

  console.log(`QUOTATION ID: ${quotation.id}`);
  console.log(`QUOTATION NUMBER: ${quotation.quotationNumber}`);

  return quotation;
}

async function runTests() {
  console.log(`
==============================================
 PIMS QUOTATION TEST SUITE
==============================================
`);

  await login();

  const pr = await getApprovedPR();

  const quotation = await createQuotation(pr);

  // ------------------------------------------
  // 4. GET QUOTATIONS
  // ------------------------------------------

  let result = await request(`${BASE_URL}/quotations`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  console.log(
    `4. GET QUOTATIONS | ${result.status} | 200 | ${
      result.status === 200 ? "✅ PASSED" : "❌ FAILED"
    }`
  );

  if (result.status !== 200) {
    console.log(result.data);
    process.exit(1);
  }

  // ------------------------------------------
  // 5. GET QUOTATION BY ID
  // ------------------------------------------

  result = await request(
    `${BASE_URL}/quotations/${quotationId}`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );

  console.log(
    `5. GET QUOTATION BY ID | ${result.status} | 200 | ${
      result.status === 200 ? "✅ PASSED" : "❌ FAILED"
    }`
  );

  // ------------------------------------------
  // 6. UPDATE QUOTATION
  // ------------------------------------------

  result = await request(
    `${BASE_URL}/quotations/${quotationId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        remarks: "Updated quotation remarks",
        items: quotation.items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: 110,
          remarks: "Updated price",
        })),
      }),
    }
  );

  console.log(
    `6. UPDATE QUOTATION | ${result.status} | 200 | ${
      result.status === 200 ? "✅ PASSED" : "❌ FAILED"
    }`
  );

  if (result.status !== 200) {
    console.log(result.data);
    process.exit(1);
  }

  // ------------------------------------------
  // 7. SUBMIT
  // ------------------------------------------

  result = await request(
    `${BASE_URL}/quotations/${quotationId}/submit`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );

  console.log(
    `7. SUBMIT QUOTATION | ${result.status} | 200 | ${
      result.status === 200 ? "✅ PASSED" : "❌ FAILED"
    }`
  );

  if (result.status !== 200) {
    console.log(result.data);
    process.exit(1);
  }

  // ------------------------------------------
  // 8. SELECT
  // ------------------------------------------

  result = await request(
    `${BASE_URL}/quotations/${quotationId}/select`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );

  console.log(
    `8. SELECT QUOTATION | ${result.status} | 200 | ${
      result.status === 200 ? "✅ PASSED" : "❌ FAILED"
    }`
  );

  if (result.status !== 200) {
    console.log(result.data);
    process.exit(1);
  }

  // ------------------------------------------
  // 9. VERIFY SELECTED
  // ------------------------------------------

  result = await request(
    `${BASE_URL}/quotations/${quotationId}`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );

  const finalQuotation = result.data.data;

  console.log(
    `9. VERIFY SELECTED STATUS | ${
      finalQuotation?.status
    } | SELECTED | ${
      finalQuotation?.status === "SELECTED"
        ? "✅ PASSED"
        : "❌ FAILED"
    }`
  );

  // ------------------------------------------
  // 10. NO TOKEN
  // ------------------------------------------

  result = await request(`${BASE_URL}/quotations`);

  console.log(
    `10. NO TOKEN PROTECTION | ${result.status} | 401 | ${
      result.status === 401 ? "✅ PASSED" : "❌ FAILED"
    }`
  );

  // ------------------------------------------
  // SUMMARY
  // ------------------------------------------

  console.log(`
==============================================
 QUOTATION TEST COMPLETE
==============================================

🎉 QUOTATION MODULE FLOW TESTED!

Flow:
APPROVED PR
    ↓
ACTIVE VENDOR
    ↓
CREATE QUOTATION
    ↓
UPDATE
    ↓
SUBMIT
    ↓
SELECT
    ↓
SELECTED

==============================================
`);
}

runTests().catch((error) => {
  console.error("\n❌ TEST CRASHED:");
  console.error(error);
  process.exit(1);
});