require("dotenv").config();

const BASE_URL = "http://localhost:5000/api";

async function request(
  endpoint,
  options = {}
) {
  const response = await fetch(
    `${BASE_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  const data = await response.json();

  return {
    status: response.status,
    data,
  };
}

function logResult(
  number,
  name,
  actual,
  expected
) {
  const passed = actual === expected;

  console.log(
    `${number}. ${name} | ${actual} | ${expected} | ${
      passed ? "✅ PASSED" : "❌ FAILED"
    }`
  );

  return passed;
}

async function main() {
  console.log(
    "\n=============================================="
  );

  console.log(
    " PIMS PURCHASE ORDER TEST SUITE"
  );

  console.log(
    "==============================================\n"
  );

  let passed = 0;
  let failed = 0;

  // ========================================================
  // 1. ADMIN LOGIN
  // ========================================================

  const login = await request(
    "/auth/login",
    {
      method: "POST",

      body: JSON.stringify({
        email: "admin@pims.com",
        password: "Admin@12345",
      }),
    }
  );

  if (
    logResult(
      1,
      "ADMIN LOGIN",
      login.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(login.data);
    return;
  }

  const token = login.data.data.token;

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // ========================================================
  // 2. GET QUOTATIONS
  // ========================================================

  const quotations =
    await request(
      "/quotations",
      {
        headers: authHeaders,
      }
    );

  if (
    logResult(
      2,
      "GET QUOTATIONS",
      quotations.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(quotations.data);
    return;
  }

  const selectedQuotation =
    quotations.data.data.find(
      (quotation) =>
        quotation.status === "SELECTED"
    );

  if (!selectedQuotation) {
    console.log(
      "\n❌ No SELECTED quotation found."
    );

    console.log(
      "Create/select a quotation first."
    );

    return;
  }

  console.log(
    "\nUSING SELECTED QUOTATION:"
  );

  console.log(
    `ID: ${selectedQuotation.id}`
  );

  console.log(
    `Number: ${selectedQuotation.quotationNumber}`
  );

  console.log(
    `Vendor: ${selectedQuotation.vendor.name}`
  );

  // ========================================================
  // 3. CREATE PURCHASE ORDER
  // ========================================================

  const createPayload = {
    quotationId: selectedQuotation.id,

    orderDate:
      new Date().toISOString(),

    expectedDeliveryDate:
      new Date(
        Date.now() +
          7 * 24 * 60 * 60 * 1000
      ).toISOString(),

    deliveryAddress:
      "Bait-us-Salam Main Store, Karachi",

    paymentTerms:
      "Payment after successful delivery",

    remarks:
      "Test Purchase Order",
  };

  console.log(
    "\nCREATE PURCHASE ORDER PAYLOAD:"
  );

  console.log(
    JSON.stringify(
      createPayload,
      null,
      2
    )
  );

  const createPO =
    await request(
      "/purchase-orders",
      {
        method: "POST",

        headers: authHeaders,

        body: JSON.stringify(
          createPayload
        ),
      }
    );

  if (
    logResult(
      3,
      "CREATE PURCHASE ORDER",
      createPO.status,
      201
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(
      "\n❌ SERVER ERROR RESPONSE:"
    );
    console.log(createPO.data);
    return;
  }

  const purchaseOrder =
    createPO.data.data;

  console.log(
    `PO ID: ${purchaseOrder.id}`
  );

  console.log(
    `PO NUMBER: ${purchaseOrder.orderNumber}`
  );

  console.log(
    `PO STATUS: ${purchaseOrder.status}`
  );

  // ========================================================
  // 4. GET PURCHASE ORDERS
  // ========================================================

  const getPOs =
    await request(
      "/purchase-orders",
      {
        headers: authHeaders,
      }
    );

  if (
    logResult(
      4,
      "GET PURCHASE ORDERS",
      getPOs.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 5. GET PURCHASE ORDER BY ID
  // ========================================================

  const getPO =
    await request(
      `/purchase-orders/${purchaseOrder.id}`,
      {
        headers: authHeaders,
      }
    );

  if (
    logResult(
      5,
      "GET PURCHASE ORDER BY ID",
      getPO.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 6. UPDATE PURCHASE ORDER
  // ========================================================

  const updatePO =
    await request(
      `/purchase-orders/${purchaseOrder.id}`,
      {
        method: "PUT",

        headers: authHeaders,

        body: JSON.stringify({
          deliveryAddress:
            "Bait-us-Salam Head Office, Karachi",

          paymentTerms:
            "Payment within 30 days",

          remarks:
            "Updated test Purchase Order",
        }),
      }
    );

  if (
    logResult(
      6,
      "UPDATE PURCHASE ORDER",
      updatePO.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(updatePO.data);
  }

  // ========================================================
  // 7. ISSUE PURCHASE ORDER
  // ========================================================

  const issuePO =
    await request(
      `/purchase-orders/${purchaseOrder.id}/issue`,
      {
        method: "POST",

        headers: authHeaders,
      }
    );

  if (
    logResult(
      7,
      "ISSUE PURCHASE ORDER",
      issuePO.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(issuePO.data);
  }

  // ========================================================
  // 8. VERIFY ISSUED STATUS
  // ========================================================

  const verifyPO =
    await request(
      `/purchase-orders/${purchaseOrder.id}`,
      {
        headers: authHeaders,
      }
    );

  const finalStatus =
    verifyPO.data.data?.status;

  if (
    logResult(
      8,
      "VERIFY ISSUED STATUS",
      finalStatus,
      "ISSUED"
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 9. NO TOKEN PROTECTION
  // ========================================================

  const noToken =
    await request(
      "/purchase-orders"
    );

  if (
    logResult(
      9,
      "NO TOKEN PROTECTION",
      noToken.status,
      401
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // FINAL
  // ========================================================

  console.log(
    "\n=============================================="
  );

  console.log(
    " PURCHASE ORDER TEST COMPLETE"
  );

  console.log(
    "=============================================="
  );

  console.log(
    `\nTOTAL PASSED: ${passed}`
  );

  console.log(
    `TOTAL FAILED: ${failed}`
  );

  if (failed === 0) {
    console.log(
      "\n🎉 PURCHASE ORDER MODULE PASSED!"
    );

    console.log(
      "\nFlow:"
    );

    console.log(
      "SELECTED QUOTATION"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "CREATE PURCHASE ORDER"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "UPDATE"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "ISSUE"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "ISSUED"
    );
  } else {
    console.log(
      "\n❌ PURCHASE ORDER MODULE HAS FAILURES"
    );
  }

  console.log(
    "\n==============================================\n"
  );
}

main().catch((error) => {
  console.error(
    "\n❌ TEST SUITE ERROR:"
  );

  console.error(error);
});