/**
 * Calculate maize equilibrium moisture content using the GAB model
 * Parameters from Talla et al. (2014) with linear interpolation
 */

function gabMaizeEMC(RH, tempC) {
  // Convert RH (%) to water activity (aw)
  const aw = RH / 100.0;

  // Parameters for maize (Talla et al. 2014)
  const paramsTable = [
    { temp: 30, Xm: 0.146, C: 12.649, K: 0.510 },
    { temp: 40, Xm: 0.124, C: 12.357, K: 0.562 },
    { temp: 50, Xm: 0.103, C: 12.172, K: 0.606 },
    { temp: 60, Xm: 0.083, C: 13.651, K: 0.649 },
  ];

  // Clamp if outside the table range
  if (tempC <= paramsTable[0].temp) return compute(paramsTable[0], aw);
  if (tempC >= paramsTable[paramsTable.length - 1].temp)
    return compute(paramsTable[paramsTable.length - 1], aw);

  // Find bounding parameter sets
  let lower, upper;
  for (let i = 0; i < paramsTable.length - 1; i++) {
    if (tempC >= paramsTable[i].temp && tempC <= paramsTable[i + 1].temp) {
      lower = paramsTable[i];
      upper = paramsTable[i + 1];
      break;
    }
  }

  // Linear interpolation helper
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  const t = (tempC - lower.temp) / (upper.temp - lower.temp);

  // Interpolated parameters
  const Xm = lerp(lower.Xm, upper.Xm, t);
  const C = lerp(lower.C, upper.C, t);
  const K = lerp(lower.K, upper.K, t);

  return compute({ Xm, C, K }, aw, tempC);
}

// GAB equation calculation
function compute(params, aw, tempC) {
  const { Xm, C, K } = params;
  const numerator = Xm * C * K * aw;
  const denominator = (1 - K * aw) * (1 + (C - 1) * K * aw);
  const Xeq = numerator / denominator;
  return {
    moistureContent: Xeq, // dry basis (kg water/kg dry solids)
    temperatureUsed: tempC,
    params: { Xm, C, K },
  };
}

export default {gabMaizeEMC};
