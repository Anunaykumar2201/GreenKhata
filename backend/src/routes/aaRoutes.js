const router = require("express").Router();
const c = require("../controllers/aaController");

router.post("/consent", c.createConsent);
router.get("/consent/:id", c.consentStatus);
router.post("/consent/:id/fetch", c.fetchData);
router.post("/notify", c.notify);

module.exports = router;