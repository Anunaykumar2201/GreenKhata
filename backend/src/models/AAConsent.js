const mongoose = require("mongoose");

module.exports = mongoose.model(
  "AAConsent",
  new mongoose.Schema(
    {
      userId: { type: String, default: "demo-user" }, // replace with real auth later
      consentId: { type: String, unique: true },
      status: String,
      dataRange: { from: String, to: String },
    },
    { timestamps: true }
  )
);