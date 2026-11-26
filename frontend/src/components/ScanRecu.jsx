import { useState } from "react";
import { FichesAPI } from "../services/api";

export default function ScanRecu({ ficheId, onProposition }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function choisir(e) {
    const fichier = e.target.files[0];
    if (!fichier) return;
    setEnCours(true);
    setErreur(null);
    try {
      onProposition(await FichesAPI.analyser(ficheId, fichier));
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label>Scanner un reçu (photo)
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={choisir} disabled={enCours} />
      </label>
      {enCours && <p>Analyse en cours… (la 1ʳᵉ fois peut prendre 30 s)</p>}
      {erreur && <p className="erreur">{erreur}</p>}
    </div>
  );
}