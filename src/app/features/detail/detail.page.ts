import { Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { DetailService } from '../../application/detail.service';
import { ErrorState } from '../../shared/ui/error-state/error-state';
import { PokeballBackdrop } from '../../shared/ui/pokeball-backdrop/pokeball-backdrop';
import { SkeletonDetail } from '../../shared/ui/skeleton-detail/skeleton-detail';
import { AboutTab } from './about-tab/about-tab';
import { DetailHeader } from './detail-header/detail-header';
import { DetailTab, DetailTabs } from './detail-tabs/detail-tabs';
import { EvolutionTab } from './evolution-tab/evolution-tab';
import { NotFoundDetail } from './not-found-detail/not-found-detail';
import { StatsTab } from './stats-tab/stats-tab';

/**
 * A single pushed detail screen for `pokemon/:id`. It owns its own DetailService
 * instance (so evolution jumps keep their own state), loads the entry from the
 * route, and renders per whole-page state, skeleton, the Type-coloured detail,
 * the mystery not-found, or a retryable error.
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
  ],
  providers: [DetailService],
  templateUrl: './detail.page.html',
  styleUrl: './detail.page.scss',
})
export class DetailPage implements OnInit {
  protected readonly detail = inject(DetailService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** The primary Type, which colours the panel and the active tab. */
  protected readonly primaryType = computed(() => this.detail.pokemon()?.types[0]);
  /** The panel/active-tab colour, the primary Type's hue or a neutral fallback. */
  protected readonly panelVar = computed(() => {
    const type = this.primaryType();
    return type ? `var(--pkx-type-${type})` : 'var(--pkx-surface)';
  });

  /** The open tab; the view opens on About. */
  protected readonly activeTab = signal<DetailTab>('about');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    void this.detail.load(id);
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
    return this.router.navigate(['/pokemon', speciesId]);
  }

  /** Steps back to where the Trainer came from, or Browse on a cold deep-link. */
  protected back(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if (state?.navigationId && state.navigationId > 1) {
      this.location.back();
    } else {
      void this.goToBrowse();
    }
  }

  /** Navigates to the Browse tab (the not-found action and cold-deep-link fallback). */
  protected goToBrowse(): Promise<boolean> {
    return this.router.navigate(['/tabs/browse']);
  }
}
