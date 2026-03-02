/**
 * Pricing helpers for USD → PHP conversion, cost calculation, and margin analysis.
 */

/** Convert USD to PHP at a given exchange rate. */
export function usdToPhp(usd: number, exchangeRate: number): number {
  return Math.round(usd * exchangeRate * 100) / 100;
}

/** Compute per-item shipping allocation: total box cost ÷ number of items. */
export function computeShippingAllocation(totalBoxCostPhp: number, itemCount: number): number {
  if (itemCount <= 0) return 0;
  return Math.round((totalBoxCostPhp / itemCount) * 100) / 100;
}

/** Compute total landed cost: (cost_usd × rate) + shipping allocation. */
export function computeTotalCost(
  costUsd: number,
  exchangeRate: number,
  shippingAllocationPhp: number,
): number {
  return usdToPhp(costUsd, exchangeRate) + shippingAllocationPhp;
}

/** Compute profit margin as a percentage. */
export function computeMargin(sellingPricePhp: number, totalCostPhp: number): number {
  if (sellingPricePhp <= 0) return 0;
  return Math.round(((sellingPricePhp - totalCostPhp) / sellingPricePhp) * 10_000) / 100;
}

/** Compute absolute profit per unit. */
export function computeProfit(sellingPricePhp: number, totalCostPhp: number): number {
  return Math.round((sellingPricePhp - totalCostPhp) * 100) / 100;
}

/** Format a number as Philippine Peso. */
export function formatPhp(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a number as US Dollar. */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}
