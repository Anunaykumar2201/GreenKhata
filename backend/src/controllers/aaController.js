const setu = require("../services/setuservice");
const AAConsent = require("../models/AAConsent");
const fs = require("fs");
const path = require("path");

exports.createConsent = async (req, res) => {
  try {
    const { mobile } = req.body;
    const c = await setu.createConsent(mobile);

    await AAConsent.findOneAndUpdate(
      { consentId: c.id },
      {
        consentId: c.id,
        status: c.status,
      },
      { upsert: true, new: true }
    );

    res.json({ consentId: c.id, url: c.url, status: c.status });
  } catch (e) {
    console.error("Create consent error:", e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
};

exports.consentStatus = async (req, res) => {
  try {
    const c = await setu.getConsent(req.params.id);
    await AAConsent.updateOne({ consentId: req.params.id }, { status: c.status });
    res.json({ status: c.status, accountsLinked: c.accountsLinked });
  } catch (e) {
    console.error("Get consent status error:", e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
};

// create data session, wait for completion, return transactions
exports.fetchData = async (req, res) => {
  try {
    const consentId = req.params.id;

    // 1. Fetch latest consent object to get precise timestamps
    const c = await setu.getConsent(consentId);
    if (!c) return res.status(404).json({ error: "Unknown consent" });

    // 2. Compute a safe dataRange strictly inside the 90-day consent window
    const consentStart = new Date(c.detail?.consentStart || c.createdAt || Date.now());
    const to = new Date(consentStart.getTime() - 2 * 60 * 60 * 1000); // 2 hours before consent creation
    const from = new Date(consentStart.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days before

    const dataRange = {
      from: from.toISOString(),
      to: to.toISOString(),
    };

    // 3. Create session with Setu
    let s = await setu.createSession(consentId, dataRange);

    // 4. Poll for session completion
    for (let i = 0; i < 15 && !["COMPLETED", "PARTIAL", "FAILED"].includes(s.status); i++) {
      await new Promise((r) => setTimeout(r, 1500));
      s = await setu.getSession(s.id);
    }

    // 5. Flatten transactions across accounts
    const txns = [];
    for (const fip of s.fips || []) {
      for (const acc of fip.accounts || []) {
        const list = acc.data?.account?.transactions?.transaction || [];
        txns.push(...list);
      }
    }

    // Cache local copy for instant testing
    try {
      const devDir = path.join(process.cwd(), "dev-data");
      if (!fs.existsSync(devDir)) fs.mkdirSync(devDir, { recursive: true });
      fs.writeFileSync(path.join(devDir, "transactions.json"), JSON.stringify(txns, null, 2));
    } catch (err) {
      console.warn("Could not write local cache:", err.message);
    }

    // Update status in local DB
    await AAConsent.updateOne({ consentId }, { status: "COMPLETED" });

    res.json({
      success: true,
      sessionStatus: s.status,
      count: txns.length,
      transactions: txns,
    });
  } catch (e) {
    console.error("Fetch data error:", e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
};

// Retrieve previously saved/cached transactions
exports.getSavedTransactions = (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "dev-data", "transactions.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return res.json({ success: true, count: data.length, transactions: data, isCached: true });
    }
    return res.json({ success: true, count: 0, transactions: [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Setu webhook notification handler
exports.notify = (req, res) => {
  console.log("Setu notification received:", JSON.stringify(req.body));
  res.sendStatus(200);
};