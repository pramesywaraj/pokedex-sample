import { Location } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { DetailService } from '../../application/detail.service';
import { ErrorState } from '../../shared/ui/error-state/error-state';
import { PokeballBackdrop } from '../../shared/ui/pokeball-backdrop/pokeball-backdrop';
import { SkeletonDetail } from '../../shared/ui/skeleton-detail/skeleton-detail';
import { AboutTab } from './about-tab/about-tab';
import { DetailHeader } from './detail-header/detail-header';
import { NotFoundDetail } from './not-found-detail/not-found-detail';

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
    AboutTab,
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

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    void this.detail.load(id);
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
