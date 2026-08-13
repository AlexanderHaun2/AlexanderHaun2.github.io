import { Trip } from '../models/trip';

export type SortOption = 'none' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc';

// Groups trips by resort name. Building this once when the trip list loads
// means filtering by a specific resort afterward is a single Map lookup,
// O(1) on average, instead of an O(n) scan through the full list every
// time the user changes the resort filter.
export function buildResortIndex(trips: Trip[]): Map<string, Trip[]> {
  const index = new Map<string, Trip[]>();
  for (const trip of trips) {
    const existing = index.get(trip.resort);
    if (existing) {
      existing.push(trip);
    } else {
      index.set(trip.resort, [trip]);
    }
  }
  return index;
}

// perPerson is stored as a string in the database schema, so it has to be
// parsed before it can be compared numerically. Non-numeric values sort
// to the end rather than breaking the comparison.
export function parsePrice(trip: Trip): number {
  const value = parseFloat(trip.perPerson);
  return isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
}

// Returns a new sorted array; does not mutate the input.
export function sortTrips(trips: Trip[], option: SortOption): Trip[] {
  const sorted = [...trips];
  switch (option) {
    case 'price-asc':
      return sorted.sort((a, b) => parsePrice(a) - parsePrice(b));
    case 'price-desc':
      return sorted.sort((a, b) => parsePrice(b) - parsePrice(a));
    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    case 'date-desc':
      return sorted.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
    default:
      return sorted;
  }
}

// Case-insensitive substring match on trip name. A free-text search over
// an unindexed field cannot be faster than O(n) in the worst case, since
// every candidate has to be inspected at least once.
export function searchByName(trips: Trip[], term: string): Trip[] {
  const normalized = term.trim().toLowerCase();
  if (normalized.length === 0) {
    return trips;
  }
  return trips.filter((trip) => trip.name.toLowerCase().includes(normalized));
}

// Combines resort filtering (Map lookup), name search, and sorting into the
// final list to render, without ever re-fetching from the server.
export function applyTripFilters(
  allTrips: Trip[],
  resortIndex: Map<string, Trip[]>,
  selectedResort: string,
  searchTerm: string,
  sortOption: SortOption
): Trip[] {
  const base = selectedResort ? resortIndex.get(selectedResort) ?? [] : allTrips;
  const searched = searchByName(base, searchTerm);
  return sortTrips(searched, sortOption);
}
