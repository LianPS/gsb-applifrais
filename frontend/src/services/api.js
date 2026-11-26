const API_URL = import.meta.env.VITE_API_URL;

// --- session : jeton + profil, rangés dans le navigateur ---
export function getToken() { return localStorage.getItem("token"); }
export function getVisiteur() {
  try { return JSON.parse(localStorage.getItem("visiteur")); } catch { return null; }
}
export function setSession(token, visiteur) {
  localStorage.setItem("token", token);
  localStorage.setItem("visiteur", JSON.stringify(visiteur));
}
export function logout() { localStorage.clear(); location.href = "/login"; }

// --- appel générique : colle le jeton, centralise les erreurs ---
async function http(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), // ← MODIF 1
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401 && token) { logout(); throw new Error("Session expirée"); }
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error || `Erreur ${res.status}`);
  }
  return res.json();
}

// --- actions métier (une fonction = une route de l'API) ---
export const AuthAPI = {
  login: (email, password) =>
    http("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
};

export const FichesAPI = {
  lister: () => http("/fiches"),
  lire: (id) => http(`/fiches/${id}`),
  creer: (mois) => http("/fiches", { method: "POST", body: JSON.stringify({ mois }) }),
  majForfait: (id, lignesForfait) =>
    http(`/fiches/${id}/forfait`, { method: "PUT", body: JSON.stringify({ lignesForfait }) }),
  ajouterLigne: (id, ligne) =>
    http(`/fiches/${id}/lignes`, { method: "POST", body: JSON.stringify(ligne) }),
  cloturer: (id) => http(`/fiches/${id}/cloturer`, { method: "PUT" }),
  valider: (id) => http(`/fiches/${id}/valider`, { method: "PUT" }),

  // ← MODIF 2 : chapitre 7
  analyser: (id, fichier) => {
    const fd = new FormData();
    fd.append("recu", fichier);
    return http(`/fiches/${id}/analyse`, { method: "POST", body: fd });
  },
  justificatif: (id, cle) => http(`/fiches/${id}/justificatif?cle=${encodeURIComponent(cle)}`),
};