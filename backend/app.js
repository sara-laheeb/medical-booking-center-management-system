const path = require("path");
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/index");
const errorHandler = require("./middleware/errorHandler");
const notFoundHandler = require("./middleware/notFoundHandler");

const app = express();

// Enable cross-origin requests for frontend clients
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../public")));

// Health check route
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is running",
        data: { status: "ok" }
    });
});

// Versioned REST API
app.use("/api/v1", apiRoutes);

// JSON 404 for unknown API routes
app.use("/api", notFoundHandler);

// SPA fallback — serve frontend for non-API browser routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handling (must be registered last)
app.use(errorHandler);

module.exports = app;
