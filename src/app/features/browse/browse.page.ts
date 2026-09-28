import { Component, OnInit, inject } from '@angular/core';
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
import { RouterLink } from '@angular/router';
import { FeedService } from '../../application/feed.service';
import { ErrorState } from '../../shared/ui/error-state/error-state';
import { PokemonCard } from '../../shared/ui/pokemon-card/pokemon-card';
import { SkeletonCard } from '../../shared/ui/skeleton-card/skeleton-card';

/**
 * The Browse tab, an infinite-scroll grid of the whole dex, network-paged. It
 * delegates all state to FeedService and just renders per state, skeleton grid
 * on first load, cards + a bottom spinner as more pages arrive, and a full-view
 * or inline error with Retry on failure.
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
  ],
  templateUrl: './browse.page.html',
  styleUrl: './browse.page.scss',
})
export class BrowsePage implements OnInit {
  protected readonly feed = inject(FeedService);

  /** Placeholder cells for the first-load skeleton grid. */
  protected readonly skeletons = Array.from({ length: 12 });

  ngOnInit(): void {
    if (this.feed.items().length === 0) {
      void this.feed.loadNext();
    }
  }

  /** Appends the next page as the Trainer nears the list's end. */
  protected async onInfinite(event: InfiniteScrollCustomEvent): Promise<void> {
    await this.feed.loadNext();
    await event.target.complete();
  }
}
