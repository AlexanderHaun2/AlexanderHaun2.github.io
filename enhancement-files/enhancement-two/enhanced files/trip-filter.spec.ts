import { Trip } from '../models/trip';
import {
  buildResortIndex,
  parsePrice,
  sortTrips,
  searchByName,
  applyTripFilters,
} from './trip-filter';

describe('trip-filter utilities', () => {
  const trips: Trip[] = [
    { _id: '1', code: 'BALI01', name: 'Bali Getaway', length: '7 days', start: new Date('2026-03-01'), resort: 'Nusa Dua', perPerson: '1500', image: 'a.png', description: '' },
    { _id: '2', code: 'BALI02', name: 'Bali Adventure', length: '10 days', start: new Date('2026-05-15'), resort: 'Nusa Dua', perPerson: '1899', image: 'b.png', description: '' },
    { _id: '3', code: 'FIJI01', name: 'Fiji Escape', length: '5 days', start: new Date('2026-01-10'), resort: 'Denarau Island', perPerson: '2200', image: 'c.png', description: '' },
    { _id: '4', code: 'FIJI02', name: 'Fiji Family Trip', length: '6 days', start: new Date('2026-08-01'), resort: 'Denarau Island', perPerson: 'call for price', image: 'd.png', description: '' },
  ];

  describe('buildResortIndex', () => {
    it('groups trips by resort so each resort is a single Map lookup', () => {
      const index = buildResortIndex(trips);
      expect(index.size).toBe(2);
      expect(index.get('Nusa Dua')?.length).toBe(2);
      expect(index.get('Denarau Island')?.length).toBe(2);
    });

    it('returns undefined for a resort with no trips, rather than throwing', () => {
      const index = buildResortIndex(trips);
      expect(index.get('Nowhere')).toBeUndefined();
    });
  });

  describe('parsePrice', () => {
    it('parses a numeric perPerson string', () => {
      expect(parsePrice(trips[0])).toBe(1500);
    });

    it('treats a non-numeric perPerson as the maximum value instead of NaN', () => {
      expect(parsePrice(trips[3])).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('sortTrips', () => {
    it('sorts by price ascending, cheapest first', () => {
      const sorted = sortTrips(trips, 'price-asc');
      expect(sorted[0].code).toBe('BALI01');
    });

    it('sorts non-numeric prices to the end when ascending', () => {
      const sorted = sortTrips(trips, 'price-asc');
      expect(sorted[sorted.length - 1].code).toBe('FIJI02');
    });

    it('sorts by price descending, most expensive first', () => {
      const sorted = sortTrips(trips, 'price-desc');
      expect(sorted[0].code).toBe('FIJI02'); // non-numeric treated as max
    });

    it('sorts by start date ascending, earliest first', () => {
      const sorted = sortTrips(trips, 'date-asc');
      expect(sorted[0].code).toBe('FIJI01');
    });

    it('sorts by start date descending, latest first', () => {
      const sorted = sortTrips(trips, 'date-desc');
      expect(sorted[0].code).toBe('FIJI02');
    });

    it('does not mutate the array passed in', () => {
      const original = [...trips];
      sortTrips(trips, 'price-asc');
      expect(trips).toEqual(original);
    });
  });

  describe('searchByName', () => {
    it('matches case-insensitively on a substring of the name', () => {
      const results = searchByName(trips, 'bali');
      expect(results.length).toBe(2);
    });

    it('returns an empty array when nothing matches', () => {
      expect(searchByName(trips, 'antarctica').length).toBe(0);
    });

    it('returns the full list when the search term is blank', () => {
      expect(searchByName(trips, '   ').length).toBe(trips.length);
    });
  });

  describe('applyTripFilters (full pipeline)', () => {
    const index = buildResortIndex(trips);

    it('filters by resort alone', () => {
      const result = applyTripFilters(trips, index, 'Denarau Island', '', 'none');
      expect(result.length).toBe(2);
    });

    it('combines a resort filter with a name search', () => {
      const result = applyTripFilters(trips, index, 'Denarau Island', 'family', 'none');
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('FIJI02');
    });

    it('sorts the full trip list by price when no filters are applied', () => {
      const result = applyTripFilters(trips, index, '', '', 'price-asc');
      expect(result[0].code).toBe('BALI01');
    });

    it('returns an empty array when the search matches nothing, even with no resort filter', () => {
      const result = applyTripFilters(trips, index, '', 'nonexistent-trip-name', 'none');
      expect(result.length).toBe(0);
    });
  });
});
