const mongoose = require("mongoose");
const { z } = require("zod");
const Fiche = require("../models/fiche");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

function assertId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Identifiant invalide", 400);
}

// GET /fiches — visiteur : SES fiches ; comptable : toutes
exports.lister = asyncHandler(async (req, res) => {
  const filtre = req.user.role === "comptable" ? {} : { visiteur: req.user.id };
  const fiches = await Fiche.find(filtre).populate("visiteur", "nom prenom").sort({ mois: -1 });
  res.json(fiches);
});

// GET /fiches/:id — anti-IDOR
exports.lire = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const fiche = await Fiche.findById(req.params.id).populate("visiteur", "nom prenom");
  if (!fiche) throw new AppError("Fiche introuvable", 404);
  if (req.user.role !== "comptable" && String(fiche.visiteur._id) !== req.user.id)
    throw new AppError("Accès refusé", 403);
  res.json(fiche);
});

// POST /fiches — le visiteur crée SA fiche du mois
exports.creer = asyncHandler(async (req, res) => {
  const { mois } = z.object({ mois: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.body);
  const fiche = await Fiche.create({
    visiteur: req.user.id, mois, etat: "CR",
    historiqueEtats: [{ etat: "CR", par: req.user.id }],
  });
  res.status(201).json(fiche);
});

// PUT /fiches/:id/forfait — saisir les quantités forfaitisées
exports.majForfait = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const { lignesForfait } = z.object({
    lignesForfait: z.array(z.object({
      codeType: z.enum(["KM", "EF", "NUI", "REP"]),
      quantite: z.coerce.number().min(0),
    })),
  }).parse(req.body);
  const fiche = await Fiche.findById(req.params.id);
  if (!fiche) throw new AppError("Fiche introuvable", 404);
  if (String(fiche.visiteur) !== req.user.id) throw new AppError("Accès refusé", 403);
  if (fiche.etat !== "CR") throw new AppError("Fiche non modifiable", 409);
  fiche.lignesForfait = lignesForfait;
  await fiche.save();
  res.json(fiche);
});

// POST /fiches/:id/lignes — ajouter un frais hors forfait
exports.ajouterLigne = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const ligne = z.object({
    date: z.coerce.date(),
    libelle: z.string().min(1).max(100),
    montant: z.coerce.number().positive(),
    justificatif: z.string().optional(),
  }).parse(req.body);
  const fiche = await Fiche.findById(req.params.id);
  if (!fiche) throw new AppError("Fiche introuvable", 404);
  if (String(fiche.visiteur) !== req.user.id) throw new AppError("Accès refusé", 403);
  if (fiche.etat !== "CR") throw new AppError("Fiche non modifiable", 409);
  fiche.lignesHorsForfait.push(ligne);
  await fiche.save();
  res.status(201).json(fiche);
});

// PUT /fiches/:id/cloturer — CR → CL, par SON visiteur
exports.cloturer = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const fiche = await Fiche.findById(req.params.id);
  if (!fiche) throw new AppError("Fiche introuvable", 404);
  if (String(fiche.visiteur) !== req.user.id) throw new AppError("Accès refusé", 403);
  if (fiche.etat !== "CR") throw new AppError("Seule une fiche créée peut être clôturée", 409);
  fiche.etat = "CL";
  fiche.historiqueEtats.push({ etat: "CL", par: req.user.id });
  await fiche.save();
  res.json(fiche);
});

// PUT /fiches/:id/valider — CL → VA, par le comptable (pas de contrôle de propriété)
exports.valider = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const fiche = await Fiche.findById(req.params.id);
  if (!fiche) throw new AppError("Fiche introuvable", 404);
  if (fiche.etat !== "CL") throw new AppError("Seule une fiche clôturée peut être validée", 409);
  fiche.etat = "VA";
  fiche.historiqueEtats.push({ etat: "VA", par: req.user.id });
  await fiche.save();
  res.json(fiche);
});