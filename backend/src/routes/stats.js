const router = require("express").Router();
const ctrl = require("../controllers/stats");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.use(requireAuth, requireRole("comptable"));

router.get("/par-type", ctrl.parType);

module.exports = router;