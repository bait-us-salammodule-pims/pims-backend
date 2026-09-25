const http = require("http");

const ADMIN_EMAIL = "admin@pims.com";
const ADMIN_PASSWORD = "Admin@12345";

let adminToken = "";
let categoryId = null;
let itemId = null;

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method,
      headers: {},
    };

    if (data) {
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] =
        Buffer.byteLength(data);
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
};

const pass = (message) => {
  console.log(`✅ ${message}`);
};

const fail = (message, response) => {
  console.log(`❌ ${message}`);
  console.log("Response:", response.body);
};

const runTests = async () => {
  console.log("\n=================================");
  console.log(" PIMS ITEM MANAGEMENT TEST SUITE");
  console.log("=================================\n");

  // =================================
  // 1. ADMIN LOGIN
  // =================================

  console.log("1. ADMIN LOGIN");

  const login = await request(
    "POST",
    "/api/auth/login",
    {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }
  );

  console.log("Status:", login.status);

  if (login.status === 200) {
    adminToken = login.body.data.token;
    pass("ADMIN LOGIN PASSED");
  } else {
    fail("ADMIN LOGIN FAILED", login);
    return;
  }

  // =================================
  // 2. CREATE CATEGORY
  // =================================

  console.log("\n2. CREATE ITEM CATEGORY");

  const category = await request(
    "POST",
    "/api/items/categories",
    {
      name: "Office Supplies",
      code: "OFFICE",
      description: "General office supplies",
    },
    adminToken
  );

  console.log("Status:", category.status);

  if (category.status === 201) {
    categoryId = category.body.data.id;
    pass("CREATE CATEGORY PASSED");
  } else {
    fail("CREATE CATEGORY FAILED", category);
    return;
  }

  // =================================
  // 3. GET CATEGORIES
  // =================================

  console.log("\n3. GET ITEM CATEGORIES");

  const categories = await request(
    "GET",
    "/api/items/categories",
    null,
    adminToken
  );

  console.log("Status:", categories.status);

  if (
    categories.status === 200 &&
    Array.isArray(categories.body.data)
  ) {
    console.log(
      "Categories:",
      categories.body.data.length
    );

    pass("GET CATEGORIES PASSED");
  } else {
    fail("GET CATEGORIES FAILED", categories);
  }

  // =================================
  // 4. DUPLICATE CATEGORY
  // =================================

  console.log("\n4. DUPLICATE CATEGORY PROTECTION");

  const duplicateCategory = await request(
    "POST",
    "/api/items/categories",
    {
      name: "Office Supplies",
      code: "OFFICE",
    },
    adminToken
  );

  console.log("Status:", duplicateCategory.status);

  if (duplicateCategory.status === 400) {
    pass("DUPLICATE CATEGORY PROTECTION PASSED");
  } else {
    fail(
      "DUPLICATE CATEGORY PROTECTION FAILED",
      duplicateCategory
    );
  }

  // =================================
  // 5. CREATE ITEM
  // =================================

  console.log("\n5. CREATE ITEM");

  const item = await request(
    "POST",
    "/api/items",
    {
      name: "A4 Paper",
      code: "A4-PAPER",
      description: "Standard A4 printing paper",
      unit: "PACK",
      reorderLevel: 10,
      categoryId,
    },
    adminToken
  );

  console.log("Status:", item.status);

  if (item.status === 201) {
    itemId = item.body.data.id;
    pass("CREATE ITEM PASSED");
  } else {
    fail("CREATE ITEM FAILED", item);
    return;
  }

  // =================================
  // 6. GET ITEMS
  // =================================

  console.log("\n6. GET ITEMS");

  const items = await request(
    "GET",
    "/api/items",
    null,
    adminToken
  );

  console.log("Status:", items.status);

  if (
    items.status === 200 &&
    Array.isArray(items.body.data)
  ) {
    console.log("Items:", items.body.data.length);
    pass("GET ITEMS PASSED");
  } else {
    fail("GET ITEMS FAILED", items);
  }

  // =================================
  // 7. GET ITEM BY ID
  // =================================

  console.log("\n7. GET ITEM BY ID");

  const singleItem = await request(
    "GET",
    `/api/items/${itemId}`,
    null,
    adminToken
  );

  console.log("Status:", singleItem.status);

  if (
    singleItem.status === 200 &&
    singleItem.body.data.id === itemId
  ) {
    pass("GET ITEM BY ID PASSED");
  } else {
    fail("GET ITEM BY ID FAILED", singleItem);
  }

  // =================================
  // 8. DUPLICATE ITEM
  // =================================

  console.log("\n8. DUPLICATE ITEM PROTECTION");

  const duplicateItem = await request(
    "POST",
    "/api/items",
    {
      name: "Another A4 Paper",
      code: "A4-PAPER",
      unit: "PACK",
      reorderLevel: 5,
      categoryId,
    },
    adminToken
  );

  console.log("Status:", duplicateItem.status);

  if (duplicateItem.status === 400) {
    pass("DUPLICATE ITEM PROTECTION PASSED");
  } else {
    fail(
      "DUPLICATE ITEM PROTECTION FAILED",
      duplicateItem
    );
  }

  // =================================
  // 9. UPDATE ITEM
  // =================================

  console.log("\n9. UPDATE ITEM");

  const updatedItem = await request(
    "PUT",
    `/api/items/${itemId}`,
    {
      name: "A4 Printing Paper",
      code: "A4-PAPER",
      description: "Updated A4 printing paper",
      unit: "PACK",
      reorderLevel: 20,
      categoryId,
    },
    adminToken
  );

  console.log("Status:", updatedItem.status);

  if (
    updatedItem.status === 200 &&
    updatedItem.body.data.name === "A4 Printing Paper"
  ) {
    pass("UPDATE ITEM PASSED");
  } else {
    fail("UPDATE ITEM FAILED", updatedItem);
  }

  // =================================
  // 10. INVALID CATEGORY
  // =================================

  console.log("\n10. INVALID CATEGORY PROTECTION");

  const invalidCategoryItem = await request(
    "POST",
    "/api/items",
    {
      name: "Invalid Category Item",
      code: "INVALID-CATEGORY",
      unit: "PCS",
      reorderLevel: 5,
      categoryId: 999999,
    },
    adminToken
  );

  console.log("Status:", invalidCategoryItem.status);

  if (invalidCategoryItem.status === 400) {
    pass("INVALID CATEGORY PROTECTION PASSED");
  } else {
    fail(
      "INVALID CATEGORY PROTECTION FAILED",
      invalidCategoryItem
    );
  }

  // =================================
  // 11. DEACTIVATE ITEM
  // =================================

  console.log("\n11. DEACTIVATE ITEM");

  const deactivatedItem = await request(
    "PATCH",
    `/api/items/${itemId}/deactivate`,
    null,
    adminToken
  );

  console.log("Status:", deactivatedItem.status);

  if (
    deactivatedItem.status === 200 &&
    deactivatedItem.body.data.isActive === false
  ) {
    pass("DEACTIVATE ITEM PASSED");
  } else {
    fail("DEACTIVATE ITEM FAILED", deactivatedItem);
  }

  // =================================
  // 12. NO TOKEN
  // =================================

  console.log("\n12. NO TOKEN TEST");

  const noToken = await request(
    "GET",
    "/api/items"
  );

  console.log("Status:", noToken.status);

  if (noToken.status === 401) {
    pass("AUTHENTICATION PROTECTION PASSED");
  } else {
    fail("AUTHENTICATION PROTECTION FAILED", noToken);
  }

  console.log("\n=================================");
  console.log(" ITEM TEST SUITE COMPLETED");
  console.log("=================================\n");
};

runTests().catch((error) => {
  console.error("\n❌ TEST SUITE ERROR");
  console.error(error.message);
});