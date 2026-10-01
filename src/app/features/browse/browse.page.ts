import { Component, OnInit, ViewChild, computed, inject } from '@angular/core';
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
import { NetworkService } from '../../application/network.service';
import { PokemonIndexService } from '../../application/pokemon-index.service';
import { PokemonTypeName } from '../../domain/pokemon-type-name';
import { ErrorState } from '../../shared/ui/error-state/error-state';
import { PokemonCard } from '../../shared/ui/pokemon-card/pokemon-card';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { SkeletonCard } from '../../shared/ui/skeleton-card/skeleton-card';
import { StateScreen } from '../../shared/ui/state-screen/state-screen';
import { TypeFilter } from '../../shared/ui/type-filter/type-filter';

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
    TypeFilter,
  ],
  templateUrl: './browse.page.html',
  styleUrl: './browse.page.scss',
})
export class BrowsePage implements OnInit {
  protected readonly feed = inject(FeedService);
  protected readonly index = inject(PokemonIndexService);
  protected readonly network = inject(NetworkService);

  /** Placeholder cells for the first load skeleton grid. */
  protected readonly skeletons = Array.from({ length: 12 });

  /**
   * When the device drops offline before the grid has anything to show, swap
   * the main view out for the offline state so the Trainer isn't staring at a
   * stuck skeleton. Once cards are on screen we keep them visible, so a blip
   * mid scroll doesn't blank what's already been loaded.
   */
  protected readonly showOffline = computed(
    () => !this.network.online() && this.feed.items().length === 0,
  );

  /**
   * Nav between neighbouring Pokémon is only meaningful when the grid is the
   * full Dex, a detail opened from a Type filter or search carries browseNav
   * false in the router state so the Back button returns to that set.
   */
  protected readonly detailNavState = computed(() => ({
    browseNav: this.feed.mode() === 'browse',
  }));

  @ViewChild(SearchBar) private searchBar?: SearchBar;

  constructor() {
    // When the connection returns, quietly retry whatever couldn't land while
    // we were offline, the index first since Browse leans on it for everything.
    this.network.onReconnect(() => {
      if (this.index.error()) {
        void this.index.retry();
      }
      if (this.feed.status() === 'error' || this.feed.items().length === 0) {
        this.retryFirstPage();
      }
    });
  }

  ngOnInit(): void {
    if (this.feed.items().length === 0) {
      void this.feed.showBrowse().then(() => this.index.warmUpTypes());
    } else {
      void this.index.warmUpTypes();
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

  /**
   * Retries the failed first page in whichever mode the grid is in. Type mode
   * re-picks the active Type so its cold fetch runs again.
   */
  protected retryFirstPage(): void {
    const active = this.feed.activeType();
    if (active) {
      void this.feed.showByType(active);
      return;
    }
    void this.feed.loadNext();
  }

  /** Switches the grid onto a Type filter, or back to full browse for `All`. */
  protected onTypePick(type: PokemonTypeName | null): void {
    this.searchBar?.clear();
    if (type === null) {
      void this.feed.showBrowse();
      return;
    }
    void this.feed.showByType(type);
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
