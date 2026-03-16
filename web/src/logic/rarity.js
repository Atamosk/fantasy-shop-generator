export function adjustRarityWeights(baseWeights, level) {
  const steps = Math.floor((level - 5) / 4);
  if (steps === 0) return { ...baseWeights };

  const result = { ...baseWeights };
  const shiftAmount = Math.abs(steps) * 10;

  if (steps > 0) {
    const actualShift = Math.min(shiftAmount, result.Common || 0);
    result.Common = (result.Common || 0) - actualShift;

    const rareTiers = Object.keys(result).filter(k => k !== 'Common' && result[k] > 0);
    const rareTotal = rareTiers.reduce((sum, k) => sum + result[k], 0);

    if (rareTotal > 0) {
      let distributed = 0;
      rareTiers.forEach((tier, i) => {
        if (i === rareTiers.length - 1) {
          result[tier] += actualShift - distributed;
        } else {
          const share = Math.round(actualShift * result[tier] / rareTotal);
          result[tier] += share;
          distributed += share;
        }
      });
    }
  } else {
    const rareTiers = Object.keys(result).filter(k => k !== 'Common' && result[k] > 0);
    const rareTotal = rareTiers.reduce((sum, k) => sum + result[k], 0);
    const actualShift = Math.min(shiftAmount, rareTotal);

    let taken = 0;
    rareTiers.forEach((tier, i) => {
      if (i === rareTiers.length - 1) {
        const take = actualShift - taken;
        result[tier] -= take;
      } else {
        const take = Math.round(actualShift * result[tier] / rareTotal);
        result[tier] -= take;
        taken += take;
      }
    });
    result.Common = (result.Common || 0) + actualShift;
  }

  return result;
}
