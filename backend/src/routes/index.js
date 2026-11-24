const router = require("express").Router();

router.use("/auth", require("./auth"));
router.use("/fiches", require("./fiches"));

module.exports = router;