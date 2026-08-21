export const mesesOpciones = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
].map((m, i) => ({ value: String(i + 1), label: m }));

export const semestresOpciones = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}° semestre`,
}));
