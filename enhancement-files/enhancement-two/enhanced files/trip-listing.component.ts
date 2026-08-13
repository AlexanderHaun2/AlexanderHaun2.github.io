import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripCardComponent } from '../trip-card/trip-card.component';

import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data.service';
import { buildResortIndex, applyTripFilters, SortOption } from '../utils/trip-filter';

import { Router } from '@angular/router';

import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, TripCardComponent],
  templateUrl: './trip-listing.component.html',
  styleUrl: './trip-listing.component.css',
  providers: [TripDataService]
})

export class TripListingComponent implements OnInit {

  // The full, unfiltered list of trips
  private allTrips: Trip[] = [];

  // Trips grouped by resort name, built once whenever allTrips changes.
  private resortIndex: Map<string, Trip[]> = new Map();

  // The list actually rendered, after filter/search/sort is applied
  trips: Trip[] = [];

  // Populated from resortIndex's keys, used to build the resort dropdown.
  resorts: string[] = [];

  searchTerm: string = '';
  selectedResort: string = '';
  sortOption: SortOption = 'none';

  message: string = '';

  constructor(
    private tripDataService: TripDataService,
    private router: Router,
    private authenticationService: AuthenticationService
    ) {
    console.log('trip-listing constructor');
  }

  public isLoggedIn()
  {
    return this.authenticationService.isLoggedIn();
  }

  public addTrip(): void {
    this.router.navigate(['add-trip']);
  }

  // Re-runs the filter/search/sort pipeline against the trips already in
  // memory. Called whenever the user changes the search box, the resort
  // dropdown, or the sort option, none of which require another request
  // to the server.
  public onFilterChange(): void {
    this.trips = applyTripFilters(
      this.allTrips,
      this.resortIndex,
      this.selectedResort,
      this.searchTerm,
      this.sortOption
    );
  }

  private getStuff(): void {
    this.tripDataService.getTrips()
      .subscribe({
        next: (value: Trip[]) => {
          this.allTrips = value;
          this.resortIndex = buildResortIndex(this.allTrips);
          this.resorts = Array.from(this.resortIndex.keys()).sort();

          if(value.length > 0)
          {
            this.message = 'There are ' + value.length + ' trips available.';
          }
          else{
            this.message = 'There were no trips retireved from the database';
          }
          console.log(this.message);

          this.onFilterChange();
        },
        error: (error: any) => {
          console.log('Error: ' + error);
        }
      })
  }


  ngOnInit(): void {
    console.log('ngOnInit');
    this.getStuff();
  }
}
