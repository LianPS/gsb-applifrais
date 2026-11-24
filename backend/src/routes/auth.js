const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/auth");
const { requireAuth } = require("../middlewares/auth");

const limiteLogin = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, skipSuccessfulRequests: true });

router.post("/login", limiteLogin, ctrl.login);
router.get("/me", requireAuth, ctrl.moi);

module.exports = router;