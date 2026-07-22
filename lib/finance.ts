/**
 * Replicated from CarpoolFinanceManager.kt
 * Pakistan 2026 Price Benchmarks
 */

const SMALL_CAR_COST_PER_KM = 38.0;
const LARGE_CAR_COST_PER_KM = 54.0;

const SMALL_CAR_MARKET_KM = 75.0;
const LARGE_CAR_MARKET_KM = 115.0;

export const CarpoolFinanceManager = {
  isLargeVehicle: (postedSeats: number): boolean => postedSeats > 3,

  calculateSuggestedPrice: (distance: number, postedSeats: number): number => {
    const costPerKm = postedSeats > 3 ? LARGE_CAR_COST_PER_KM : SMALL_CAR_COST_PER_KM;
    const totalTripCost = costPerKm * distance;
    // Divide by (postedSeats + 1) because driver is also a passenger
    const basePrice = totalTripCost / (postedSeats + 1);

    // Round to nearest 10 for clean PKR display
    return Math.round(basePrice / 10) * 10;
  },

  calculateDriverResult: (revenue: number, distance: number, postedSeats: number): number => {
    const costPerKm = postedSeats > 3 ? LARGE_CAR_COST_PER_KM : SMALL_CAR_COST_PER_KM;
    const totalTripExpense = costPerKm * distance;
    return revenue - totalTripExpense;
  },

  calculatePassengerSavings: (pricePaid: number, distance: number, postedSeats: number): number => {
    const marketPerKm = postedSeats > 3 ? LARGE_CAR_MARKET_KM : SMALL_CAR_MARKET_KM;
    const marketPrice = marketPerKm * distance;
    return marketPrice - pricePaid;
  }
};
