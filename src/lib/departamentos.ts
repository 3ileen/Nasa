// Claves en mayúsculas y sin tildes (igual que NOMBDEP en departamentos.geojson).
export const NOMBRES: Record<string, string> = {
  AMAZONAS: "Amazonas",
  ANCASH: "Áncash",
  APURIMAC: "Apurímac",
  AREQUIPA: "Arequipa",
  AYACUCHO: "Ayacucho",
  CAJAMARCA: "Cajamarca",
  CALLAO: "Callao",
  CUSCO: "Cusco",
  HUANCAVELICA: "Huancavelica",
  HUANUCO: "Huánuco",
  ICA: "Ica",
  JUNIN: "Junín",
  "LA LIBERTAD": "La Libertad",
  LAMBAYEQUE: "Lambayeque",
  LIMA: "Lima",
  LORETO: "Loreto",
  "MADRE DE DIOS": "Madre de Dios",
  MOQUEGUA: "Moquegua",
  PASCO: "Pasco",
  PIURA: "Piura",
  PUNO: "Puno",
  "SAN MARTIN": "San Martín",
  TACNA: "Tacna",
  TUMBES: "Tumbes",
  UCAYALI: "Ucayali",
};

export const DEPARTAMENTOS = Object.keys(NOMBRES);

/** Quita tildes y pasa a minúsculas: sirve para buscar sin importar acentos. */
export const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** "Madre De Dios", "San_Martin", "Junín" → "MADRE DE DIOS", "SAN MARTIN", "JUNIN". */
export const claveDepartamento = (s: string) =>
  sinTildes(s).replace(/_/g, " ").replace(/\s+/g, " ").trim().toUpperCase();

export const nombreDepartamento = (clave: string) => NOMBRES[clave] ?? clave;
