const router = require("express").Router();
const multer = require("multer");
const ctrl = require("../controllers/fiches");
const ocr = require("../controllers/ocr");
const { requireAuth, requireRole } = require("../middlewares/auth");

// upload en mémoire : images uniquement, 5 Mo max
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)),
});

router.use(requireAuth);

router.get("/", ctrl.lister);
router.post("/", requireRole("visiteur"), ctrl.creer);
router.get("/:id", ctrl.lire);
router.put("/:id/forfait", requireRole("visiteur"), ctrl.majForfait);
router.post("/:id/lignes", requireRole("visiteur"), ctrl.ajouterLigne);
router.post("/:id/analyse", requireRole("visiteur"), upload.single("recu"), ocr.analyser);
router.get("/:id/justificatif", ocr.justificatif);
router.put("/:id/cloturer", requireRole("visiteur"), ctrl.cloturer);
router.put("/:id/valider", requireRole("comptable"), ctrl.valider);

module.exports = router;