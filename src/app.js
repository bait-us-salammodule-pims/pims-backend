const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const organizationRoutes = require("./routes/organization.routes");
const itemRoutes = require("./routes/item.routes");
const vendorRoutes = require("./routes/vendor.routes");
const purchaseRequestRoutes = require("./routes/purchase-request.routes");
const quotationRoutes = require("./routes/quotation.routes");
const purchaseOrderRoutes = require("./routes/purchase-order.routes");
const grnRoutes = require("./routes/grn.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const stockTransferRoutes = require("./routes/stock-transfer.routes");

const app = express();

// ==============================
// GLOBAL MIDDLEWARE
// ==============================

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ==============================
// API ROUTES
// ==============================

app.use("/api/auth", authRoutes);

app.use("/api/organization", organizationRoutes);

app.use("/api/items", itemRoutes);

app.use("/api/vendors", vendorRoutes);

app.use("/api/purchase-requests", purchaseRequestRoutes);

app.use("/api/quotations", quotationRoutes);

app.use("/api/purchase-orders", purchaseOrderRoutes);

app.use("/api/grns", grnRoutes);

app.use("/api/inventory", inventoryRoutes);

app.use("/api/stock-transfers", stockTransferRoutes);
// ==============================
// HEALTH CHECK
// ==============================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PIMS Backend is running",
  });
});

// ==============================
// 404 HANDLER
// ==============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ==============================
// GLOBAL ERROR HANDLER
// ==============================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;