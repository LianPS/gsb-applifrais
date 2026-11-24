const PRIX = {
  KM: 0.62,
  EF: 110,
  NUI: 80,
  REP: 25,
};

function montant(code) {
  return PRIX[code];
}

module.exports = { montant };