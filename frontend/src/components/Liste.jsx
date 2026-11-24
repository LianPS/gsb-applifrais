import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FichesAPI, getVisiteur } from "../services/api";

const ETAT = { CR: "Créée", CL: "Clôturée", VA: "Validée", MP: "Mise en paiement", RB: "Remboursée" };

export default function Liste() {
  const [fiches, setFiches] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [mois, setMois] = useState("");
  const role = getVisiteur()?.role;

  function charger() {
    FichesAPI.lister().then(setFiches).catch((e) => setErreur(e.message));
  }
  useEffect(() => { charger(); }, []);

  async function creer(e) {
    e.preventDefault();
    setErreur(null);
    try { await FichesAPI.creer(mois); setMois(""); charger(); }
    catch (err) { setErreur(err.message); }
  }

  return (
    <div>
      <h1>{role === "comptable" ? "Toutes les fiches" : "Mes fiches"}</h1>
      {erreur && <div className="erreur">{erreur}</div>}
      {role === "visiteur" && (
        <form onSubmit={creer}>
          <input placeholder="2026-12" value={mois} onChange={(e) => setMois(e.target.value)} />
          <button>Nouvelle fiche</button>
        </form>
      )}
      <table>
        <thead>
          <tr>
            <th>Mois</th>
            {role === "comptable" && <th>Visiteur</th>}
            <th>État</th><th>Total</th><th></th>
          </tr>
        </thead>
        <tbody>
          {fiches.map((f) => (
            <tr key={f._id}>
              <td>{f.mois}</td>
              {role === "comptable" && <td>{f.visiteur?.prenom} {f.visiteur?.nom}</td>}
              <td>{ETAT[f.etat]}</td>
              <td>{f.total?.toFixed(2)} €</td>
              <td><Link to={`/fiches/${f._id}`}>Ouvrir</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}