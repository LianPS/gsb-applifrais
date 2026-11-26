const mongoose = require("mongoose");
const { createWorker } = require("tesseract.js");
const Fiche = require("../models/fiche");
const { televerser, lienTemporaire } = require("../services/stockage");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// le plus gros « xx,xx » du ticket = souvent le total
function extraireMontant(t) {
  const m = t.match(/\d+[.,]\d{2}/g);
  return m ? Math.max(...m.map((s) => parseFloat(s.replace(",", ".")))) : null;
}

// première date JJ/MM/AAAA (ou JJ-MM-AA…) → format AAAA-MM-JJ pour le formulaire
function extraireDate(t) {
  const d = t.match(/(\d{2})[/.-](\d{2})[/.-](\d{2,4})/);
  if (!d) return null;
  const annee = d[3].length === 2 ? `20${d[3]}` : d[3];
  return `${annee}-${d[2]}-${d[1]}`;
}

// POST /fiches/:id/analyse — stocke la photo, PROPOSE un frais (n'enregistre rien)
exports.analyser = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("Aucune image reçue (jpeg, png ou webp, 5 Mo max)", 400);
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError("Identifiant invalide", 400);
  const fiche = await Fiche.findById(req.params.id);
  if (!fiche || String(fiche.visiteur) !== req.user.id) throw new AppError("Accès refusé", 403);
  if (fiche.etat !== "CR") throw new AppError("Fiche non modifiable", 409);

  const cle = await televerser(req.file.buffer, req.file.mimetype); // 1. stockage
  const worker = await createWorker("fra");                          // 2. OCR
  const { data } = await worker.recognize(req.file.buffer);
  await worker.terminate();

  res.json({                                                          // 3. proposition
    proposition: { montant: extraireMontant(data.text), date: extraireDate(data.text), justificatif: cle },
    confiance: Math.round(data.confidence ?? 0),
  });
});

// GET /fiches/:id/justificatif?cle=... → { url } (lien signé 5 min)
exports.justificatif = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError("Identifiant invalide", 400);
  const fiche = await Fiche.findById(req.params.id);
  if (!fiche) throw new AppError("Fiche introuvable", 404);
  const aLeDroit = String(fiche.visiteur) === req.user.id || req.user.role === "comptable";
  if (!aLeDroit) throw new AppError("Accès refusé", 403);
  if (!fiche.lignesHorsForfait.some((l) => l.justificatif === req.query.cle))
    throw new AppError("Justificatif introuvable", 404);
  res.json({ url: await lienTemporaire(req.query.cle) });
});