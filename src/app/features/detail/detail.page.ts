import { Location } from '@angular/common';
import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { canPopHistory } from '../../application/can-pop-history';
import { DetailService } from '../../application/detail.service';
import { FavouritesService } from '../../application/favourites.service';
import { NetworkService } from '../../application/network.service';
import { PokemonIndexService } from '../../application/pokemon-index.service';
import { StatusBarService } from '../../application/status-bar.service';
import { ErrorState } from '../../shared/ui/error-state/error-state';
import { PokeballBackdrop } from '../../shared/ui/pokeball-backdrop/pokeball-backdrop';
import { SkeletonDetail } from '../../shared/ui/skeleton-detail/skeleton-detail';
import { StateScreen } from '../../shared/ui/state-screen/state-screen';
import { AboutTab } from './about-tab/about-tab';
import { DetailHeader } from './detail-header/detail-header';
import { DetailTab, DetailTabs } from './detail-tabs/detail-tabs';
import { EvolutionTab } from './evolution-tab/evolution-tab';
import { heroStatusBarContent } from './hero-status-bar';
import { NotFoundDetail } from './not-found-detail/not-found-detail';
import { StatsTab } from './stats-tab/stats-tab';

/** Horizontal distance in pixels a swipe must travel before it counts. */
const SWIPE_THRESHOLD_PX = 60;
/** Max vertical drift before a gesture is treated as a scroll, not a swipe. */
const SWIPE_VERTICAL_TOLERANCE_PX = 40;

/**
 * A single pushed detail screen for `pokemon/:id`. It owns its own DetailService
 * instance (so evolution jumps keep their own state), reacts to route id
 * changes (so replace URL swipes rebind to the new entry on the same mounted
 * page), and renders per whole page state, skeleton, the Type coloured detail,
 * the mystery notfound, or a retryable error. From a Browse origin detail it
 * also wires up the swipe, chevron and keyboard navigation to adjacent entries,
 * and warms their data in the background so the next entry feels instant.
 */
@Component({
  selector: 'app-detail',
  imports: [
    IonContent,
    SkeletonDetail,
    PokeballBackdrop,
    DetailHeader,
    DetailTabs,
    AboutTab,
    StatsTab,
    EvolutionTab,
    NotFoundDetail,
    ErrorState,
    StateScreen,
  ],
  providers: [DetailService],
  templateUrl: './detail.page.html',
  styleUrl: './detail.page.scss',
})
export class DetailPage implements OnInit {
  protected readonly detail = inject(DetailService);
  protected readonly favourites = inject(FavouritesService);
  protected readonly index = inject(PokemonIndexService);
  protected readonly network = inject(NetworkService);
  private readonly statusBar = inject(StatusBarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  /** The entry id this screen is bound to, mirrors the current route param. */
  private readonly entryId = signal(0);

  /**
   * Whether swipe/arrow nav is on in principle for this screen, taken from the
   * router state's browseNav flag at mount, carried onward by replace URL swipes
   * so a chain of neighbours stays enabled. Absent state (deeplink, refresh)
   * defaults to enabled, so a cold open to a Browse shaped URL still swipes.
   */
  private readonly navEnabled = signal(this.readNavEnabledFromHistory());

  /** The primary Type, which colours the panel and the active tab. */
  protected readonly primaryType = computed(() => this.detail.pokemon()?.types[0]);
  /** Whether this Pokémon is currently saved, tracks the FavouritesService signal. */
  protected readonly isFavourite = computed(() => {
    const pokemon = this.detail.pokemon();
    return pokemon ? this.favourites.isFavourite(pokemon.id) : false;
  });
  /** The panel/active-tab colour, the primary Type's hue or a neutral fallback. */
  protected readonly panelVar = computed(() => {
    const type = this.primaryType();
    return type ? `var(--pkx-type-${type})` : 'var(--pkx-surface)';
  });

  /** Readable mirror of the nav enabled flag for the header's PokemonNav input. */
  protected readonly navOn = this.navEnabled.asReadonly();
  /** The ids on either side of the current entry, empty until the index lands. */
  protected readonly neighbours = computed(() =>
    this.index.ready() ? this.index.neighbours(this.entryId()) : {},
  );
  protected readonly prevId = computed(() => this.neighbours().prev);
  protected readonly nextId = computed(() => this.neighbours().next);

  /** The open tab; the view opens on About. */
  protected readonly activeTab = signal<DetailTab>('about');

  /**
   * While offline before the core Pokémon has landed, swap in the offline state
   * over the skeleton or error view. Once the detail is on screen the normal
   * view stays, so cached content remains readable through a brief blip.
   */
  protected readonly showOffline = computed(
    () => !this.network.online() && this.detail.pokemon() === undefined,
  );

  constructor() {
    // Once the index has loaded, warm the neighbours of whatever entry is on screen
    // and keep doing it as the Trainer swipes to an adjacent entry.
    effect(() => {
      const id = this.entryId();
      const ready = this.index.ready();
      if (id === 0 || !this.navEnabled() || !ready) {
        return;
      }
      const { prev, next } = this.index.neighbours(id);
      this.detail.prefetchNeighbours(prev, next);
    });

    // The Type hero runs full bleed under the status bar, so the clock and icons
    // follow whatever colour is behind them, re-reading it as the Pokémon lands
    // and as a swipe rebinds this screen to its neighbour.
    effect(() => this.claimStatusBar());

    // When the connection returns, retry whatever the detail couldn't finish
    // loading while we were offline, so the Trainer doesn't have to tap Retry.
    this.network.onReconnect(() => {
      if (this.detail.status() === 'error' || this.detail.status() === 'loading') {
        void this.detail.retry();
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      this.entryId.set(id);
      this.activeTab.set('about');
      void this.detail.load(id);
    });
    void this.favourites.load();
    void this.index.load();
  }

  /**
   * Takes the status bar back whenever this screen comes to the front, which a
   * stacked evolution jump needs on the way back, because the hero behind the
   * clock is this Pokémon's again and not the one that was just popped.
   */
  ionViewWillEnter(): void {
    this.claimStatusBar();
  }

  /**
   * Hands the status bar back to the white app canvas. Ionic runs this before
   * the arriving screen's enter, so a Detail opening on top of this one still
   * gets the last word on its own colour.
   */
  ionViewWillLeave(): void {
    this.statusBar.resetToCanvas();
  }

  /** Toggles the current Pokémon in the saved set (optimistic, reverts on write failure). */
  protected toggleFavourite(): void {
    const pokemon = this.detail.pokemon();
    if (!pokemon) {
      return;
    }
    void this.favourites.toggle({
      id: pokemon.id,
      name: pokemon.name,
      artworkUrl: pokemon.artworkUrl,
      types: pokemon.types,
    });
  }

  /** Switches the open tab, lazily loading the evolution line the first time it opens. */
  protected selectTab(tab: DetailTab): void {
    this.activeTab.set(tab);
    if (tab === 'evolution') {
      void this.detail.loadEvolution();
    }
  }

  /** Pushes a tapped evolution stage's detail (Back returns to this one). */
  protected openStage(speciesId: number): Promise<boolean> {
    return this.router.navigate(['/pokemon', speciesId], {
      state: { browseNav: this.navEnabled() },
    });
  }

  /** Steps back to where the Trainer came from, or Browse on a cold deep-link. */
  protected back(): void {
    if (canPopHistory(this.location.getState())) {
      this.location.back();
    } else {
      void this.goToBrowse();
    }
  }

  /** Navigates to the Browse tab (the not-found action and cold-deep-link fallback). */
  protected goToBrowse(): Promise<boolean> {
    return this.router.navigate(['/tabs/browse']);
  }

  /** Walks to the previous entry in list order via a URL replace, if one exists. */
  protected goPrev(): void {
    const id = this.prevId();
    if (id !== undefined) {
      this.navigateToNeighbour(id);
    }
  }

  /** Walks to the next entry in list order via a URL replace, if one exists. */
  protected goNext(): void {
    const id = this.nextId();
    if (id !== undefined) {
      this.navigateToNeighbour(id);
    }
  }

  /** Catches prev/next while the detail is on screen, with nav enabled only. */
  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.navEnabled() || this.detail.status() !== 'ready') {
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.goNext();
    }
  }

  private swipeStart: { x: number; y: number } | null = null;

  /** Begins tracking a horizontal swipe when nav is enabled. */
  @HostListener('touchstart', ['$event'])
  protected onTouchStart(event: TouchEvent): void {
    if (!this.navEnabled() || this.detail.status() !== 'ready') {
      this.swipeStart = null;
      return;
    }
    const touch = event.touches[0];
    this.swipeStart = { x: touch.clientX, y: touch.clientY };
  }

  /** Resolves the gesture on touchend, horizontal past the threshold walks the Dex. */
  @HostListener('touchend', ['$event'])
  protected onTouchEnd(event: TouchEvent): void {
    const start = this.swipeStart;
    this.swipeStart = null;
    if (!start) {
      return;
    }
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dy) > SWIPE_VERTICAL_TOLERANCE_PX) {
      return;
    }
    if (dx <= -SWIPE_THRESHOLD_PX) {
      this.goNext();
    } else if (dx >= SWIPE_THRESHOLD_PX) {
      this.goPrev();
    }
  }

  /**
   * Reads the nav enabled flag from history.state, carried in router state by
   * Browse (true), Favourites / Type / Search (false). Defaults to true when the
   * flag is absent so a deeplink / refresh of a Browse shaped URL still swipes.
   */
  private readNavEnabledFromHistory(): boolean {
    const state = history.state as { browseNav?: boolean } | null;
    return state?.browseNav !== false;
  }

  /** Points the status bar at whatever this screen is currently showing. */
  private claimStatusBar(): void {
    this.statusBar.setContentColour(heroStatusBarContent(this.detail.status(), this.primaryType()));
  }

  /** Replaces the URL with the neighbour's, carrying the nav enabled flag forward. */
  private navigateToNeighbour(id: number): void {
    void this.router.navigate(['/pokemon', id], {
      replaceUrl: true,
      state: { browseNav: this.navEnabled() },
    });
  }
}
