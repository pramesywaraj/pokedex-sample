import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  InfiniteScrollCustomEvent,
  IonButton,
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { FeedService } from '../../application/feed.service';
import { PokemonIndexService } from '../../application/pokemon-index.service';
import { ErrorState } from '../../shared/ui/error-state/error-state';
import { PokemonCard } from '../../shared/ui/pokemon-card/pokemon-card';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { SkeletonCard } from '../../shared/ui/skeleton-card/skeleton-card';
import { StateScreen } from '../../shared/ui/state-screen/state-screen';

/**
 * The Browse tab, an infinite scroll grid of the whole dex. It hosts the search
 * bar at the top, delegates all data state to FeedService, and swaps in a
 * search unavailable state when the startup index fetch fails.
 */
@Component({
  selector: 'app-browse',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonButton,
    RouterLink,
    PokemonCard,
    SkeletonCard,
    ErrorState,
    SearchBar,
    StateScreen,
  ],
  templateUrl: './browse.page.html',
  styleUrl: './browse.page.scss',
})
export class BrowsePage implements OnInit {
  protected readonly feed = inject(FeedService);
  protected readonly index = inject(PokemonIndexService);

  /** Placeholder cells for the first load skeleton grid. */
  protected readonly skeletons = Array.from({ length: 12 });

  @ViewChild(SearchBar) private searchBar?: SearchBar;

  ngOnInit(): void {
    if (this.feed.items().length === 0) {
      void this.feed.showBrowse();
    }
  }

  /** Appends the next page as the Trainer nears the list end. */
  protected async onInfinite(event: InfiniteScrollCustomEvent): Promise<void> {
    await this.feed.loadNext();
    await event.target.complete();
  }

  /** Feeds a new query to the grid, or returns to browse when it's empty. */
  protected onQueryChange(query: string): void {
    void this.feed.showSearch(query);
  }

  /** Retries the startup index load from the search unavailable state. */
  protected retryIndex(): void {
    void this.index.retry();
  }

  /** Clears the search bar and returns to browse (used by the "No matches" state). */
  protected clearSearch(): void {
    this.searchBar?.clear();
  }
}
