/**
 * Fast linear regression prediction — no TensorFlow.js needed.
 * Returns prediction data that can be directly plotted on ECharts.
 */
export function predict(rawData, forecastDays = 20) {
  if (!rawData?.length || rawData.length < 30) return null

  const closes = rawData.map(d => d[1])
  const n = Math.min(60, closes.length)
  const recent = closes.slice(-n)

  // Linear regression
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) { sumX += i; sumY += recent[i]; sumXY += i * recent[i]; sumX2 += i * i }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Standard error
  let residuals = 0
  for (let i = 0; i < n; i++) residuals += Math.pow(recent[i] - (slope * i + intercept), 2)
  const stdErr = Math.sqrt(residuals / (n - 2))

  // Mean of x for confidence interval calculation
  const meanX = sumX / n

  // Generate predictions
  const predictions = []
  for (let i = 0; i < forecastDays; i++) {
    const x = n + i
    const pred = slope * x + intercept
    // Prediction interval: wider for further-out predictions
    const se = stdErr * Math.sqrt(1 + 1 / n + Math.pow(x - meanX, 2) / (sumX2 - sumX * sumX / n))
    predictions.push({ value: pred, upper: pred + 2 * se, lower: pred - 2 * se })
  }

  return {
    predictions,
    slope,
    trend: slope > 0 ? 'up' : 'down',
    confidence: predictions.map(p => ({ upper: p.upper, lower: p.lower })),
  }
}
