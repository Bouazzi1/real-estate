/**
 * Utility function to format numbers/prices with space as thousands separator
 * Example: 790000 -> "790 000"
 * Example: 1850000 -> "1 850 000"
 */
export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === "" || isNaN(Number(price))) {
    return "0";
  }
  const num = Math.round(Number(price));
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Formats price with currency string
 * Example: 790000 -> "790 000 DT"
 */
export function formatPriceWithCurrency(price: number | string | null | undefined, currency = "DT"): string {
  return `${formatPrice(price)} ${currency}`;
}
