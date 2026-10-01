import { Component, OnInit, computed, inject, linkedSignal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { FavouritesService } from '../../application/favourites.service';
import { PokemonTypeName, typeLabel } from '../../domain/pokemon-type-name';
import { ErrorState } from '../../shared/ui/error-state/error-state';
import { EmptyFavourites } from './empty-favourites/empty-favourites';
import { PokemonCard } from '../../shared/ui/pokemon-card/pokemon-card';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { SkeletonCard } from '../../shared/ui/skeleton-card/skeleton-card';
import { StateScreen } from '../../shared/ui/state-screen/state-screen';
import { TypeFilter } from '../../shared/ui/type-filter/type-filter';

/**
 * The Favourites tab, the saved set laid out with the same PokemonCard the
 * Browse grid uses. Cards colour from the stored types, so nothing fetches on
 * this screen. A search bar and a Type chip row narrow the saved set locally,
 * and only one of them is active at a time. Empty and read error states each
 * have their own view.
 */
@Component({
  selector: 'app-favourites',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    RouterLink,
    PokemonCard,
    SkeletonCard,
    ErrorState,
    EmptyFavourites,
    SearchBar,
    StateScreen,
    TypeFilter,
  ],
  templateUrl: './favourites.page.html',
  styleUrl: './favourites.page.scss',
})
export class FavouritesPage implements OnInit {
  protected readonly favourites = inject(FavouritesService);
  private readonly router = inject(Router);

  /** Placeholder cells for the first-read skeleton grid. */
  protected readonly skeletons = Array.from({ length: 6 });

  /**
   * Carries browseNav false in router state so a detail opened from Favourites
   * leaves the swipe/arrow Pokémon nav off, and Back returns here.
   */
  protected readonly detailNavState = { browseNav: false };

  private readonly searchBar = viewChild(SearchBar);

  protected readonly hasEntries = computed(() => this.favourites.entries().length > 0);

  /**
   * The Type chip in play, or null for All. Linked to hasEntries so the filter
   * starts fresh whenever the saved set empties out and fills up again, since
   * the chip row is gone while nothing is saved.
   */
  protected readonly activeType = linkedSignal<boolean, PokemonTypeName | null>({
    source: this.hasEntries,
    computation: () => null,
  });

  /** The search text in play, reset the same way as the Type chip. */
  protected readonly query = linkedSignal<boolean, string>({
    source: this.hasEntries,
    computation: () => '',
  });

  /** The saved entries left after the Type chip or the search narrows them. */
  protected readonly visibleEntries = computed(() => {
    const type = this.activeType();
    return type ? this.favourites.byType(type) : this.favourites.search(this.query());
  });

  /** Title for the empty view when the picked Type has no favourites, like "No Ghost favourites". */
  protected readonly emptyTypeTitle = computed(() => {
    const type = this.activeType();
    return type ? `No ${typeLabel(type)} favourites` : '';
  });

  ngOnInit(): void {
    void this.favourites.load();
  }

  /** Sends the Trainer to Browse from the empty state. */
  protected goToBrowse(): Promise<boolean> {
    return this.router.navigate(['/tabs/browse']);
  }

  /** Narrows the saved set to a Type, or back to everything for All. Drops any search. */
  protected onTypePick(type: PokemonTypeName | null): void {
    this.clearSearch();
    this.activeType.set(type);
  }

  /** Narrows the saved set to the search text. Starting to search drops the Type chip. */
  protected onQueryChange(query: string): void {
    if (query.trim().length > 0) {
      this.activeType.set(null);
    }
    this.query.set(query);
  }

  /** Clears the search from the "No matches" view and shows the whole saved set again. */
  protected clearSearch(): void {
    this.searchBar()?.clear();
    this.query.set('');
  }
}
