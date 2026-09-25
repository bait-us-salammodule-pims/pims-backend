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
    " PIMS INVENTORY TEST SUITE"
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
  // 2. GET ITEM
  // ========================================================

  const items =
    await request(
      "/items",
      {
        headers: authHeaders,
      }
    );

  if (
    check(
      2,
      "GET ITEMS",
      items.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
    return;
  }

  const item =
    items.data.data.find(
      (item) =>
        item.id === 1
    ) ||
    items.data.data[0];

  if (!item) {
    console.log(
      "\n❌ No item found."
    );
    return;
  }

  console.log(
    `USING ITEM: ${item.name}`
  );

  // ========================================================
  // 3. CREATE RECEIPT TRANSACTION
  // ========================================================

  const transactionPayload = {
    itemId: item.id,

    transactionType:
      "RECEIPT",

    quantity: 15,

    referenceType:
      "GRN",

    referenceId: 1,

    remarks:
      "Inventory receipt from GRN-2026-00001",
  };

  console.log(
    "\nTRANSACTION PAYLOAD:"
  );

  console.log(
    JSON.stringify(
      transactionPayload,
      null,
      2
    )
  );

  const transaction =
    await request(
      "/inventory/transactions",
      {
        method: "POST",

        headers: authHeaders,

        body: JSON.stringify(
          transactionPayload
        ),
      }
    );

  if (
    check(
      3,
      "CREATE RECEIPT TRANSACTION",
      transaction.status,
      201
    )
  ) {
    passed++;
  } else {
    failed++;
    console.log(
      transaction.data
    );
    return;
  }

  console.log(
    `LEDGER ID: ${transaction.data.data.ledger.id}`
  );

  console.log(
    `STOCK: ${transaction.data.data.stock.quantity}`
  );

  // ========================================================
  // 4. GET STOCK
  // ========================================================

  const stock =
    await request(
      `/inventory/stock/${item.id}`,
      {
        headers: authHeaders,
      }
    );

  if (
    check(
      4,
      "GET STOCK BY ITEM",
      stock.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 5. VERIFY STOCK = 15
  // ========================================================

  const quantity =
    stock.data.data?.quantity;

  if (
    check(
      5,
      "VERIFY STOCK QUANTITY",
      quantity,
      15
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 6. GET ALL STOCK
  // ========================================================

  const stocks =
    await request(
      "/inventory/stock",
      {
        headers: authHeaders,
      }
    );

  if (
    check(
      6,
      "GET STOCK BALANCES",
      stocks.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 7. GET LEDGER
  // ========================================================

  const ledger =
    await request(
      "/inventory/ledger",
      {
        headers: authHeaders,
      }
    );

  if (
    check(
      7,
      "GET INVENTORY LEDGER",
      ledger.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 8. GET LEDGER BY ID
  // ========================================================

  const ledgerId =
    transaction.data.data.ledger.id;

  const ledgerEntry =
    await request(
      `/inventory/ledger/${ledgerId}`,
      {
        headers: authHeaders,
      }
    );

  if (
    check(
      8,
      "GET LEDGER BY ID",
      ledgerEntry.status,
      200
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 9. TEST INSUFFICIENT STOCK
  // ========================================================

  const issue =
    await request(
      "/inventory/transactions",
      {
        method: "POST",

        headers: authHeaders,

        body: JSON.stringify({
          itemId: item.id,

          transactionType:
            "ISSUE",

          quantity: 100,

          referenceType:
            "TEST",

          referenceId: 999,

          remarks:
            "Insufficient stock test",
        }),
      }
    );

  if (
    check(
      9,
      "INSUFFICIENT STOCK PROTECTION",
      issue.status,
      400
    )
  ) {
    passed++;
  } else {
    failed++;
  }

  // ========================================================
  // 10. NO TOKEN
  // ========================================================

  const noToken =
    await request(
      "/inventory/stock"
    );

  if (
    check(
      10,
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
    " INVENTORY TEST COMPLETE"
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
      "\n🎉 INVENTORY MODULE PASSED!"
    );

    console.log(
      "\nFlow:"
    );

    console.log(
      "GRN"
    );

    console.log(
      " ↓"
    );

    console.log(
      "RECEIPT +15"
    );

    console.log(
      " ↓"
    );

    console.log(
      "INVENTORY LEDGER"
    );

    console.log(
      " ↓"
    );

    console.log(
      "STOCK BALANCE = 15"
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