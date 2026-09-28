import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular';

/**
 * The loading placeholder for a detail screen, shaped like the real thing, a
 * neutral hero (no Type colour is known yet) with back/favourite, title, number,
 * pills and artwork, over a white sheet with the tab bar and description lines.
 */
@Component({
  selector: 'app-skeleton-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonSkeletonText],
  templateUrl: './skeleton-detail.html',
  styleUrl: './skeleton-detail.scss',
})
export class SkeletonDetail {}
