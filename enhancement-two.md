# Enhancement Two: Algorithms and Data Structures

[← Back to home](README.md)

[Read the full narrative (Word document)](narratives/CS-499-Milestone-Three-Narrative-Haun.docx)

## Artifact Description

This enhancement focuses on the trip listing feature of the Travlr Getaways Angular admin application, specifically `trip-listing.component.ts` and the new `trip-filter.ts` module. This is the same overall project used for the software design and engineering enhancement, since a single artifact may demonstrate skills across multiple ePortfolio categories.

**Code:** the most relevant before/after changes are shown inline below. To browse the complete files, see [the original branch](https://github.com/AlexanderHaun2/AlexanderHaun2.github.io/tree/main/original/travlr/app_admin) or [the enhanced version](https://github.com/AlexanderHaun2/AlexanderHaun2.github.io/tree/main/enhanced/travlr/app_admin/src/app/utils).

## Justification for Inclusion

The Milestone One code review identified a genuine gap: the trip listing displayed trips in whatever order the API returned them, with no search, filter, or sort, and the component's HTTP response handling had a type-safety gap. This was not a bug to fix but a missing capability to design, which made it a good opportunity to choose and justify a specific data structure for a specific access pattern.

**The artifact was improved with the following changes, all implemented in a new, framework-independent `trip-filter.ts` module:**

- `buildResortIndex()` groups the full trip list into a `Map` keyed by resort name when the data loads. Filtering by resort afterward is a single Map lookup, **O(1) average case**, instead of scanning the entire array every time.
- `searchByName()` performs a case-insensitive substring search across trip names, necessarily **O(n)**, since a free-text search over an unindexed field cannot be faster.
- `sortTrips()` supports ascending and descending sort by price and start date, running in **O(n log n)** using JavaScript's built-in, guaranteed-stable sort.
- `parsePrice()` safely converts the `perPerson` field for numeric comparison, treating non-numeric values as the maximum possible value so they sort to the end instead of breaking the comparison.
- `applyTripFilters()` composes the resort filter, name search, and sort into the final rendered list, without a second request to the server.
- Corrected the component's HTTP response handling, previously typed `(value: any)`, which bypassed TypeScript's type checking entirely, now typed as `Trip[]`.

## Before and After

**Loading trips: `getStuff()` in `trip-listing.component.ts`**

Before, the API response was typed as `any`, bypassing TypeScript's type checking, and the list rendered as-is with no way to search, filter, or sort it:

```typescript
this.tripDataService.getTrips()
  .subscribe({
    next: (value: any) => {
      this.trips = value;
      // no search, filter, or sort of any kind
    },
    error: (error: any) => {
      console.log('Error: ' + error);
    }
  })
```

After, the response is properly typed, and loading the trips also builds the resort index and runs the filter pipeline:

```typescript
private getStuff(): void {
  this.tripDataService.getTrips()
    .subscribe({
      next: (value: Trip[]) => {
        this.allTrips = value;
        this.resortIndex = buildResortIndex(this.allTrips);
        this.resorts = Array.from(this.resortIndex.keys()).sort();
        this.onFilterChange();
      },
      error: (error: any) => {
        console.log('Error: ' + error);
      }
    })
}
```

**The new algorithm: `buildResortIndex()` in `trip-filter.ts` (did not exist before this enhancement)**

```typescript
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
```

*[View the full file, before →](original/travlr/app_admin/src/app/trip-listing/trip-listing.component.ts) · [after →](enhancement/travlr/app_admin/src/app/trip-listing/trip-listing.component.ts)*

## Example Output

**`buildResortIndex(trips)`: the resulting Map**
```
Map(2) {
  'Nusa Dua' => ['Bali Getaway', 'Bali Adventure'],
  'Denarau Island' => ['Fiji Escape', 'Fiji Family Trip']
}
```

**`sortTrips(trips, 'price-asc')`**
```
[
  { "name": "Bali Getaway",     "perPerson": 1500 },
  { "name": "Bali Adventure",   "perPerson": 1899 },
  { "name": "Fiji Escape",      "perPerson": 2200 }
]
```

**Actual output from running `ng test` (Karma/Jasmine)**
```
17 specs, 0 failures, randomized with seed 97502 
 
trip-filter utilities 
	searchByName 
	• returns the full list when the search term is blank 
	• matches case-insensitively on a substring of the name 
	• returns an empty array when nothing matches 
 
	applyTripFilters (full pipeline) 
	• returns an empty array when the search matches nothing, even with no resort filter 
	• sorts the full trip list by price when no filters are applied 
	• combines a resort filter with a name search 
	• filters by resort alone 
 
	buildResortIndex 
	• groups trips by resort so each resort is a single Map lookup 
	• returns undefined for a resort with no trips, rather than throwing 
 
	parsePrice 
	• parses a numeric perPerson string 
	• treats a non-numeric perPerson as the maximum value instead of NaN 
 
	sortTrips 
	• sorts by price descending, most expensive first 
	• does not mutate the array passed in 
	• sorts by start date ascending, earliest first 
	• sorts by price ascending, cheapest first 
	• sorts non-numeric prices to the end when ascending 
	• sorts by start date descending, latest first 
```

## Course Outcomes

The Module One plan identified one outcome for this enhancement: designing and evaluating computing solutions using algorithmic principles while managing the trade-offs involved in design choices. This was met. Choosing a Map for resort grouping instead of repeatedly filtering an array is a direct application of selecting a data structure based on its access pattern, and documenting the O(1), O(n), and O(n log n) behavior of each operation, along with the trade-off between client-side and server-side filtering, demonstrates the trade-off analysis this outcome calls for.

## Reflection

This enhancement changed how I think about where filtering and sorting logic should live in a front-end application. Separating that logic into its own module of small, pure functions made it possible to test the actual algorithms directly, without Angular's testing harness, and made the component itself easier to read, since it now only wires the UI to functions rather than containing the logic itself.

---

[← Back to home](README.md)
