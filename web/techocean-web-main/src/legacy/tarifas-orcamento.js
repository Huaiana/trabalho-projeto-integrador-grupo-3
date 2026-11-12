const valores = {
  "2.1.2.1.1": [["Mínimo 1º período — 20'", 1466.88], ["Mínimo 1º período — 40'", 1881.43], ["Mínimo 2º a 4º períodos — 20'", 314.34], ["Mínimo 2º a 4º períodos — 40'", 403.17], ["Mínimo 5º período — 20'", 628.67], ["Mínimo 5º período — 40'", 806.34]],
  "2.1.2.1.2": [["Mínimo até 2 BLs — 20'", 1466.88], ["Mínimo até 2 BLs — 40'", 1881.43], ["Acima de 2 BLs — por BL", 913.22]],
  "2.1.2.1.3": [["Base de cálculo sem valor declarado — por kg", 3.48]],
  "2.1.2.1.4": [["1º período, até R$ 300.000 — 20'", 5406.18], ["1º período, até R$ 300.000 — 40'", 6919.83], ["1º período, acima de R$ 300.001 — 20'", 8269.79], ["1º período, acima de R$ 300.001 — 40'", 10106.55]],
  "2.1.2.1.5": [["1º período de 7 dias — livre", 0], ["2º período de 5 dias e subsequentes", 455.56], ["Gate para destinação alterada — adicional", 666.98]],
  "2.1.2.1.6": [["Adicional IMO por contêiner e período", 159.44], ["Gate para destinação alterada — adicional", 666.98]],
  "2.1.2.1.7": [["1º período de 7 dias", 455.56], ["2º período de 5 dias e subsequentes", 911.12], ["Gate para destinação alterada — adicional", 666.98]],
  "2.1.2.1.8": [["1º período de 7 dias — livre", 0], ["2º período e subsequentes — 20'", 238.37], ["2º período e subsequentes — 40'", 309.88], ["Gate para destinação alterada — adicional", 666.98]],
  "2.1.2.2.1": [["Contêiner 20'", 643.65], ["Contêiner 40'", 787.31], ["Carga solta por tonelada ou m³", 55.56], ["Mínimo por HBL/lote", 200.92]],
  "2.1.2.2.2": [["Contêiner 20'", 257.75], ["Contêiner 40'", 320.60]],
  "2.1.2.2.3": [["Contêiner 20'", 975.50], ["Contêiner 40'", 1037.87], ["Carga solta por tonelada ou m³", 83.31], ["Mínimo por HBL/lote", 301.37]],
  "2.1.2.2.4": [["Contêiner 20'", 389.74], ["Contêiner 40'", 414.90]],
  "2.1.2.2.5": [["Contêiner 20'", 1302.89], ["Contêiner 40'", 1447.66]],
  "2.1.2.2.6": [["Contêiner 20'", 257.75], ["Contêiner 40'", 320.60]],
  "2.1.2.2.7": [["Contêiner 20'", 1436.49], ["Contêiner 40'", 1661.43]],
  "2.1.2.2.8": [["Contêiner 20'", 389.74], ["Contêiner 40'", 414.90]],
  "2.1.2.2.9": [["Mecanizada por tonelada ou m³", 22.27], ["Manual por tonelada ou m³", 25.54], ["Mínimo por HBL", 105.29], ["Arrumação em caminhão de terceiro por tonelada ou m³", 13.62]],
  "2.1.2.2.10": [["Por contêiner", 333.49], ["Carga solta por tonelada ou m³", 17.03], ["Mínimo por HBL/lote", 110.68]],
  "2.1.2.2.12": [["Contêiner cheio", 338.53], ["Contêiner vazio", 167.02]],
  "2.1.2.2.13": [["Contêiner cheio", 139.73]],
  "2.1.2.2.14": [["Por contêiner", 141.73]],
  "2.1.2.2.15": [["Por veículo e hora", 14.58]],
  "2.1.2.2.16": [["Por contêiner", 1059.83]],
  "2.1.2.2.17.1": [["Por contêiner", 166.32]],
  "2.1.2.2.17.2": [["Por contêiner, por 24 horas ou fração", 678.44]],
  "2.1.2.2.18": [["Por contêiner", 911.45]],
  "2.1.2.2.20": [["Por certificado ou relatório", 107.30]],
  "2.1.2.2.21": [["Até 5 fotos por contêiner/lote", 46.60]],
  "2.1.2.2.22": [["Por contêiner, lote ou veículo", 167.02]],
  "2.1.2.2.24": [["Por unidade e dia ou fração", 200.46]],
  "2.1.2.2.25": [["Contêiner 20'", 431.26], ["Contêiner 40'", 487.96]],
  "2.1.2.2.26": [["Contêiner 20'", 676.24], ["Contêiner 40'", 898.94]],
  "2.1.2.2.27": [["Por 12 horas ou fração", 815.94]],
  "2.1.2.2.28": [["Por ocorrência", 2709.01]],
  "2.1.2.2.30": [["Com fornecimento de pallet", 136.20], ["Sem fornecimento de pallet", 68.10]],
  "2.1.2.2.31": [["Limpeza simples — 20'", 102.16], ["Limpeza simples — 40'", 170.28]],
  "2.1.2.2.32": [["Por pallet ou volume", 89.38]],
  "2.1.2.2.33": [["Contêiner 20'", 523.87], ["Contêiner 40'", 681.02]],
  "2.1.2.2.34": [["Contêiner 20'", 381], ["Contêiner 40'", 495.30]],
  "2.1.2.2.35": [["Contêiner 20'", 304.78], ["Contêiner 40'", 396.22]],
  "2.1.2.2.36": [["Contêiner 20' ou 40'", 419.06], ["Carga solta por volume", 126.36]],
  "2.1.2.2.37": [["Por contêiner", 333.49]],
  "2.1.2.2.38": [["Por contêiner/carga solta", 333.49]],
  "2.1.2.2.40": [["Por contêiner", 267.89]],
  "2.1.2.2.41": [["Por contêiner", 67.30]],
  "2.2.4": [["Durante operação — por terno, hora e período", 1346.98], ["Após finalização — por hora", 13939.53]],
  "2.2.5": [["Por metro e período de 6 horas", 15.05]],
  "2.2.6": [["Remoções/movimentações internas ou transferências até 15%", 349.38], ["Transferências acima de 15%", 1050.28]],
  "2.2.7": [["Contêiner cheio", 68.80], ["Carga solta por tonelada", 4.04]],
  "2.2.8": [["Por ocorrência", 20134.75]],
  "3.20": [["Por nota fiscal", 49.96]],
};

const horarios = ["dia útil 7–19h", "dia útil 19–7h", "sábado 7–19h", "sábado 19–7h", "domingo/feriado 7–19h", "domingo/feriado 19–7h"];
for (const [item, cheios, vazios] of [
  ["2.2.1", [976.10, 976.10, 976.10, 1165.30, 1165.30, 1496.40], [486.98, 486.98, 486.98, 581.58, 581.58, 748.20]],
  ["2.2.2.1", [866.45, 866.45, 866.45, 1273.88, 1273.88, 1479.20], [433.23, 433.23, 433.23, 636.40, 636.40, 739.60]],
  ["2.2.2.2", [638.55, 638.55, 638.55, 817, 817, 1079.30], [319.28, 319.28, 319.28, 407.43, 407.43, 539.65]],
  ["2.2.3", [540.73, 540.73, 540.73, 746.05, 746.05, 1023.40], [269.83, 269.83, 269.83, 371.95, 371.95, 511.70]],
]) {
  valores[item] = [cheios, vazios].flatMap((rates, index) => rates.map((value, i) => [`Contêiner ${index ? "vazio" : "cheio"} — ${horarios[i]}`, value]));
}

export function tarifasPadrao(item) {
  return (valores[item] || []).map(([label, value]) => `${label} | ${value.toFixed(2)}`).join("\n");
}

export function parseTarifas(text) {
  if (!String(text || "").trim()) return [];
  return String(text).split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    const match = /^([^|]+)\|\s*(\d+(?:[.,]\d{1,2})?)\s*$/.exec(line);
    if (!match || !match[1].trim() || !Number.isFinite(Number(match[2].replace(",", ".")))) throw new Error("Informe cada tarifa em uma linha no formato: condição | valor (ex.: Contêiner 20' | 643.65).");
    return { label: match[1].trim(), value: Number(match[2].replace(",", ".")) };
  });
}
