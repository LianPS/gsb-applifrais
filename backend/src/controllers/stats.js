const Fiche = require("../models/fiche");
const asyncHandler = require("../utils/asyncHandler");

// GET /stats/par-type — total remboursé par type de frais forfaitisé
exports.parType = asyncHandler(async (req, res) => {
  const data = await Fiche.aggregate([
    { $match: { etat: { $in: ["VA", "MP", "RB"] } } },
    { $unwind: "$lignesForfait" },
    { $lookup: {
        from: "typesFrais",
        localField: "lignesForfait.codeType",
        foreignField: "code",
        as: "type",
    } },
    { $unwind: "$type" },
    { $group: {
        _id: "$type.libelle",
        total: { $sum: { $multiply: ["$lignesForfait.quantite", "$type.montant"] } },
    } },
    { $sort: { total: -1 } },
  ]);
  res.json(data);
});