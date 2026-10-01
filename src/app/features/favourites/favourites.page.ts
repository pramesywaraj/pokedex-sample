import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { FavouritesService } from '../../application/favourites.service';
import { ErrorState } from '../../shared/ui/error-state/error-state';
import { EmptyFavourites } from './empty-favourites/empty-favourites';
import { PokemonCard } from '../../shared/ui/pokemon-card/pokemon-card';
import { SkeletonCard } from '../../shared/ui/skeleton-card/skeleton-card';

/**
 * The Favourites tab, the saved set laid out with the same PokemonCard the
 * Browse grid uses. Cards colour from the stored types, so nothing fetches on
 * this screen. Empty and read-error states each have their own view.
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

  ngOnInit(): void {
    void this.favourites.load();
  }

  /** Sends the Trainer to Browse from the empty state. */
  protected goToBrowse(): Promise<boolean> {
    return this.router.navigate(['/tabs/browse']);
  }
}
