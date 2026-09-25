require("dotenv").config();

const BASE_URL =
  "http://localhost:5000/api";

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
  const passed =
    actual === expected;

  console.log(
    `${number}. ${name} | ${actual} | ${expected} | ${
      passed
        ? "✅ PASSED"
        : "❌ FAILED"
    }`
  );

  return passed;
}

async function main() {
  console.log(
    "\n=============================================="
  );

  console.log(
    " PIMS GRN / RECEIVING TEST SUITE"
  );

  console.log(
    "==============================================\n"
  );

  let passed = 0;
  let failed = 0;

  // ========================================================
  // 1. LOGIN
  // ========================================================

  const login =
    await request(
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

  const token =
    login.data.data.token;

  const authHeaders = {
    Authorization:
      `Bearer ${token}`,
  };

  // ========================================================
  // 2. GET PURCHASE ORDERS
  // ========================================================

  const pos =
    await request(
      "/purchase-orders?status=ISSUED",
      {
        headers: authHeaders,
      }
    );

  if (
    logResult(
      2,
      "GET ISSUED PURCHASE ORDERS",
      pos.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(pos.data);
    return;
  }

  const issuedPO =
    pos.data.data.find(
      (po) =>
        po.status === "ISSUED"
    );

  if (!issuedPO) {
    console.log(
      "\n❌ No ISSUED Purchase Order found."
    );

    return;
  }

  console.log(
    `\nUSING PO: ${issuedPO.orderNumber}`
  );

  console.log(
    `VENDOR: ${issuedPO.vendor.name}`
  );

  console.log(
    "\nPO ITEMS:"
  );

  issuedPO.items.forEach(
    (item) => {
      console.log({
        poItemId: item.id,
        itemId: item.itemId,
        itemName:
          item.item?.name,
        ordered:
          item.quantity,
        alreadyReceived:
          item.receivedQuantity,
      });
    }
  );

  const poItem =
    issuedPO.items.find(
      (item) =>
        item.receivedQuantity <
        item.quantity
    );

  if (!poItem) {
    console.log(
      "\n❌ No remaining quantity available."
    );

    return;
  }

  const remaining =
    poItem.quantity -
    poItem.receivedQuantity;

  // ========================================================
  // 3. CREATE GRN
  // ========================================================

  const grnPayload = {
    purchaseOrderId:
      issuedPO.id,

    receivedDate:
      new Date().toISOString(),

    deliveryNoteNumber:
      "DN-TEST-001",

    remarks:
      "Test goods receiving",

    items: [
      {
        purchaseOrderItemId:
          poItem.id,

        receivedQuantity:
          remaining,

        remarks:
          "Received in good condition",
      },
    ],
  };

  console.log(
    "\nCREATE GRN PAYLOAD:"
  );

  console.log(
    JSON.stringify(
      grnPayload,
      null,
      2
    )
  );

  const createGRN =
    await request(
      "/grns",
      {
        method: "POST",

        headers: authHeaders,

        body: JSON.stringify(
          grnPayload
        ),
      }
    );

  if (
    logResult(
      3,
      "CREATE GRN",
      createGRN.status,
      201
    )
  ) {
    passed++;
  } else {
    failed++;

    console.log(
      "\n❌ SERVER ERROR:"
    );

    console.log(
      createGRN.data
    );

    return;
  }

  const grn =
    createGRN.data.data;

  console.log(
    `GRN ID: ${grn.id}`
  );

  console.log(
    `GRN NUMBER: ${grn.grnNumber}`
  );

  // ========================================================
  // 4. GET GRNs
  // ========================================================

  const grns =
    await request(
      "/grns",
      {
        headers: authHeaders,
      }
    );

  if (
    logResult(
      4,
      "GET GRNs",
      grns.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 5. GET GRN BY ID
  // ========================================================

  const getGRN =
    await request(
      `/grns/${grn.id}`,
      {
        headers: authHeaders,
      }
    );

  if (
    logResult(
      5,
      "GET GRN BY ID",
      getGRN.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 6. VERIFY GRN STATUS
  // ========================================================

  const grnStatus =
    getGRN.data.data?.status;

  if (
    logResult(
      6,
      "VERIFY GRN STATUS",
      grnStatus,
      "RECEIVED"
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 7. VERIFY PO STATUS
  // ========================================================

  const updatedPO =
    await request(
      `/purchase-orders/${issuedPO.id}`,
      {
        headers: authHeaders,
      }
    );

  const poStatus =
    updatedPO.data.data?.status;

  if (
    logResult(
      7,
      "VERIFY PO STATUS",
      poStatus,
      "COMPLETED"
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(
      updatedPO.data
    );
  }

  // ========================================================
  // 8. VERIFY RECEIVED QUANTITY
  // ========================================================

  const updatedPOItem =
    updatedPO.data.data?.items?.find(
      (item) =>
        item.id === poItem.id
    );

  const receivedQuantity =
    updatedPOItem?.receivedQuantity;

  if (
    logResult(
      8,
      "VERIFY RECEIVED QUANTITY",
      receivedQuantity,
      poItem.quantity
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 9. NO TOKEN
  // ========================================================

  const noToken =
    await request("/grns");

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
    " GRN TEST COMPLETE"
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
      "\n🎉 GRN / RECEIVING MODULE PASSED!"
    );

    console.log(
      "\nFlow:"
    );

    console.log(
      "ISSUED PO"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "CREATE GRN"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "RECEIVE GOODS"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "UPDATE PO RECEIVED QUANTITY"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "PO COMPLETED"
    );
  }
}

main().catch((error) => {
  console.error(
    "\n❌ TEST SUITE ERROR:"
  );

  console.error(error);
});