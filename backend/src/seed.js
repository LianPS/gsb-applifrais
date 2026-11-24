require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const Visiteur = require("./models/visiteur");
const TypeFrais = require("./models/typeFrais");
const Fiche = require("./models/fiche");

(async () => {
  await connectDB();
  await Promise.all([Visiteur.deleteMany({}), TypeFrais.deleteMany({}), Fiche.deleteMany({})]);

  await TypeFrais.insertMany([
    { code: "KM", libelle: "Frais kilométrique", montant: 0.62, unite: "km" },
    { code: "EF", libelle: "Forfait étape", montant: 110 },
    { code: "NUI", libelle: "Nuitée hôtel", montant: 80 },
    { code: "REP", libelle: "Repas restaurant", montant: 25 },
  ]);

  const hash = await bcrypt.hash("gsb123", 12);
  await Visiteur.insertMany([
    { nom: "Bunisset", prenom: "Denis", email: "bunisset@gsb.fr", motDePasseHash: hash },
    { nom: "Cottet", prenom: "Sylvain", email: "cottet@gsb.fr", motDePasseHash: hash },
    { nom: "Tusseau", prenom: "Louis", email: "tusseau@gsb.fr", motDePasseHash: hash },
    { nom: "Lacombe", prenom: "Sylvie", email: "lacombe@gsb.fr", motDePasseHash: hash, role: "comptable" },
  ]);

  console.log("Jeu de test inséré");
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });