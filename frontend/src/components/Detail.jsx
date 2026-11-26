import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FichesAPI, getVisiteur } from "../services/api";
import ScanRecu from "./ScanRecu";

const CODES = { KM: "Frais kilométrique (km)", EF: "Forfait étape", NUI: "Nuitée", REP: "Repas" };
const LIGNE_VIDE = { date: "", libelle: "", montant: "", justificatif: "" };

export default function Detail() {
  const { id } = useParams();
  const [fiche, setFiche] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [info, setInfo] = useState(null);
  const [forfait, setForfait] = useState({ KM: 0, EF: 0, NUI: 0, REP: 0 });
  const [ligne, setLigne] = useState(LIGNE_VIDE);
  const role = getVisiteur()?.role;

  function afficher(f) {
    setFiche(f);
    const q = { KM: 0, EF: 0, NUI: 0, REP: 0 };
    f.lignesForfait.forEach((l) => { q[l.codeType] = l.quantite; });
    setForfait(q);
  }

  useEffect(() => {
    FichesAPI.lire(id).then(afficher).catch((e) => setErreur(e.message));
  }, [id]);

  async function action(promesse) {
    setErreur(null);
    try { afficher(await promesse()); return true; }
    catch (err) { setErreur(err.message); return false; }
  }

  function enregistrerForfait(e) {
    e.preventDefault();
    const lignes = Object.entries(forfait).map(([codeType, quantite]) => ({ codeType, quantite: Number(quantite) }));
    action(() => FichesAPI.majForfait(id, lignes));
  }

  async function ajouter(e) {
    e.preventDefault();
    const { justificatif, ...reste } = ligne;
    const ok = await action(() => FichesAPI.ajouterLigne(id, justificatif ? ligne : reste));
    if (ok) { setLigne(LIGNE_VIDE); setInfo(null); }
  }

  // l'OCR PROPOSE : on pré-remplit, le visiteur vérifie puis clique « Ajouter »
  function preRemplir({ proposition, confiance }) {
    setLigne({
      date: proposition.date || "",
      libelle: "",
      montant: proposition.montant ?? "",
      justificatif: proposition.justificatif,
    });
    setInfo(`Proposition lue sur le reçu (confiance ${confiance} %) : vérifie et complète avant d'ajouter.`);
  }

  async function voirRecu(cle) {
    try {
      const { url } = await FichesAPI.justificatif(id, cle);
      window.open(url, "_blank");
    } catch (err) { setErreur(err.message); }
  }

  if (erreur && !fiche) return <p className="erreur">{erreur}</p>;
  if (!fiche) return <p>Chargement…</p>;

  const modifiable = fiche.etat === "CR" && role === "visiteur";

  return (
    <div>
      <h1>Fiche {fiche.mois} — {fiche.visiteur?.prenom} {fiche.visiteur?.nom}</h1>
      <p>État : <b>{fiche.etat}</b> · Total : <b>{fiche.total?.toFixed(2)} €</b></p>
      {erreur && <p className="erreur">{erreur}</p>}

      <h2>Frais forfaitisés</h2>
      <form onSubmit={enregistrerForfait}>
        {Object.keys(CODES).map((code) => (
          <label key={code}>{CODES[code]}
            <input type="number" min="0" disabled={!modifiable} value={forfait[code]}
              onChange={(e) => setForfait({ ...forfait, [code]: e.target.value })} />
          </label>
        ))}
        {modifiable && <button>Enregistrer</button>}
      </form>

      <h2>Frais hors forfait</h2>
      <ul>
        {fiche.lignesHorsForfait.map((l) => (
          <li key={l._id}>
            {new Date(l.date).toLocaleDateString()} — {l.libelle} — {l.montant} €
            {l.justificatif && <button onClick={() => voirRecu(l.justificatif)}>Voir le reçu</button>}
          </li>
        ))}
      </ul>

      {modifiable && (
        <>
          <ScanRecu ficheId={id} onProposition={preRemplir} />
          {info && <p>{info}</p>}
          <form onSubmit={ajouter}>
            <input type="date" value={ligne.date} onChange={(e) => setLigne({ ...ligne, date: e.target.value })} />
            <input placeholder="libellé" value={ligne.libelle} onChange={(e) => setLigne({ ...ligne, libelle: e.target.value })} />
            <input type="number" step="0.01" placeholder="montant" value={ligne.montant} onChange={(e) => setLigne({ ...ligne, montant: e.target.value })} />
            <button>+ Ajouter</button>
          </form>
        </>
      )}

      {modifiable && <button onClick={() => action(() => FichesAPI.cloturer(fiche._id))}>Clôturer la fiche</button>}
      {fiche.etat === "CL" && role === "comptable" &&
        <button onClick={() => action(() => FichesAPI.valider(fiche._id))}>Valider</button>}
    </div>
  );
}