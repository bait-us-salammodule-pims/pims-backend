require("dotenv").config();

const BASE_URL =
  "http://localhost:5000/api";

async function request(
  endpoint,
  options = {}
) {
  const response =
    await fetch(
      `${BASE_URL}${endpoint}`,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",
          ...(options.headers || {}),
        },
      }
    );

  const data =
    await response.json();

  return {
    status: response.status,
    data,
  };
}

function check(
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
    " PIMS STOCK TRANSFER TEST SUITE"
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
    check(
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
  // 2. GET STORES
  // ========================================================

  const stores =
    await request(
      "/organization/stores",
      {
        headers: authHeaders,
      }
    );

  if (
    check(
      2,
      "GET STORES",
      stores.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(stores.data);
    return;
  }

  const sourceStore =
    stores.data.data.find(
      (store) =>
        store.id === 1
    );

  const destinationStore =
    stores.data.data.find(
      (store) =>
        store.id !== 1
    );

  if (
    !sourceStore ||
    !destinationStore
  ) {
    console.log(
      "\n❌ Need two stores for transfer test."
    );

    console.log(
      "Source Store ID: 1"
    );

    console.log(
      "Please create another store first."
    );

    return;
  }

  console.log(
    `\nSOURCE: ${sourceStore.name}`
  );

  console.log(
    `DESTINATION: ${destinationStore.name}`
  );

  // ========================================================
  // 3. GET SOURCE STOCK
  // ========================================================

  const sourceStock =
    await request(
      `/inventory/stock/1`,
      {
        headers: authHeaders,
      }
    );

  if (
    check(
      3,
      "GET SOURCE STOCK",
      sourceStock.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(
      sourceStock.data
    );
    return;
  }

  // ========================================================
  // 4. CREATE TRANSFER
  // ========================================================

  const transferPayload = {
    sourceStoreId:
      sourceStore.id,

    destinationStoreId:
      destinationStore.id,

    transferDate:
      new Date().toISOString(),

    remarks:
      "Test stock transfer",

    items: [
      {
        itemId: 1,
        quantity: 5,
        remarks:
          "Transfer A4 paper",
      },
    ],
  };

  console.log(
    "\nTRANSFER PAYLOAD:"
  );

  console.log(
    JSON.stringify(
      transferPayload,
      null,
      2
    )
  );

  const createTransfer =
    await request(
      "/stock-transfers",
      {
        method: "POST",

        headers: authHeaders,

        body: JSON.stringify(
          transferPayload
        ),
      }
    );

  if (
    check(
      4,
      "CREATE TRANSFER",
      createTransfer.status,
      201
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(
      createTransfer.data
    );
    return;
  }

  const transfer =
    createTransfer.data.data;

  console.log(
    `TRANSFER ID: ${transfer.id}`
  );

  console.log(
    `TRANSFER NUMBER: ${transfer.transferNumber}`
  );

  // ========================================================
  // 5. GET TRANSFER
  // ========================================================

  const getTransfer =
    await request(
      `/stock-transfers/${transfer.id}`,
      {
        headers: authHeaders,
      }
    );

  if (
    check(
      5,
      "GET TRANSFER BY ID",
      getTransfer.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 6. APPROVE
  // ========================================================

  const approve =
    await request(
      `/stock-transfers/${transfer.id}/approve`,
      {
        method: "POST",

        headers: authHeaders,
      }
    );

  if (
    check(
      6,
      "APPROVE TRANSFER",
      approve.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(
      approve.data
    );
    return;
  }

  const approvedStatus =
    approve.data.data.status;

  if (
    check(
      7,
      "VERIFY APPROVED STATUS",
      approvedStatus,
      "APPROVED"
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 8. DISPATCH
  // ========================================================

  const dispatch =
    await request(
      `/stock-transfers/${transfer.id}/dispatch`,
      {
        method: "POST",

        headers: authHeaders,
      }
    );

  if (
    check(
      8,
      "DISPATCH TRANSFER",
      dispatch.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(
      dispatch.data
    );
    return;
  }

  // ========================================================
  // 9. VERIFY IN TRANSIT
  // ========================================================

  const inTransit =
    dispatch.data.data.status;

  if (
    check(
      9,
      "VERIFY IN_TRANSIT STATUS",
      inTransit,
      "IN_TRANSIT"
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 10. VERIFY SOURCE STOCK
  // ========================================================

  const sourceAfterDispatch =
    await request(
      `/inventory/stock/1`,
      {
        headers: authHeaders,
      }
    );

  const sourceQuantity =
    sourceAfterDispatch.data.data.quantity;

  if (
    check(
      10,
      "VERIFY SOURCE STOCK",
      sourceQuantity,
      10
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 11. RECEIVE
  // ========================================================

  const receive =
    await request(
      `/stock-transfers/${transfer.id}/receive`,
      {
        method: "POST",

        headers: authHeaders,
      }
    );

  if (
    check(
      11,
      "RECEIVE TRANSFER",
      receive.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(
      receive.data
    );
    return;
  }

  // ========================================================
  // 12. VERIFY COMPLETED
  // ========================================================

  const completedStatus =
    receive.data.data.status;

  if (
    check(
      12,
      "VERIFY COMPLETED STATUS",
      completedStatus,
      "COMPLETED"
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 13. GET DESTINATION STOCK
  // ========================================================

  const destinationStock =
    await request(
      `/inventory/stock/1?storeId=${destinationStore.id}`,
      {
        headers: authHeaders,
      }
    );

  /**
   * NOTE:
   * Current stock endpoint by item needs
   * store filtering support.
   *
   * Instead fetch all stock balances.
   */

  const allStocks =
    await request(
      `/inventory/stock`,
      {
        headers: authHeaders,
      }
    );

  const destinationBalance =
    allStocks.data.data.find(
      (stock) =>
        stock.itemId === 1 &&
        stock.storeId ===
          destinationStore.id
    );

  const destinationQuantity =
    destinationBalance?.quantity;

  if (
    check(
      13,
      "VERIFY DESTINATION STOCK",
      destinationQuantity,
      5
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(
      allStocks.data
    );
  }

  // ========================================================
  // 14. VERIFY SOURCE STOCK
  // ========================================================

  const allStockBalances =
    await request(
      "/inventory/stock",
      {
        headers: authHeaders,
      }
    );

  const finalSource =
    allStockBalances.data.data.find(
      (stock) =>
        stock.itemId === 1 &&
        stock.storeId ===
          sourceStore.id
    );

  if (
    check(
      14,
      "VERIFY FINAL SOURCE STOCK",
      finalSource?.quantity,
      10
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 15. NO TOKEN
  // ========================================================

  const noToken =
    await request(
      "/stock-transfers"
    );

  if (
    check(
      15,
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
    " STOCK TRANSFER TEST COMPLETE"
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
      "\n🎉 STOCK TRANSFER MODULE PASSED!"
    );

    console.log(
      "\nFlow:"
    );

    console.log(
      "MAIN STORE = 15"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "TRANSFER 5"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "DISPATCH"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "MAIN STORE = 10"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "RECEIVE"
    );

    console.log(
      "    ↓"
    );

    console.log(
      "DESTINATION STORE = 5"
    );
  }
}

main().catch(
  (error) => {
    console.error(
      "\n❌ TEST SUITE ERROR:"
    );

    console.error(error);
  }
);