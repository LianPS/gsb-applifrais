const router = require("express").Router();

router.use("/auth", require("./auth"));
router.use("/fiches", require("./fiches"));
router.use("/stats", require("./stats"));

module.exports = router;