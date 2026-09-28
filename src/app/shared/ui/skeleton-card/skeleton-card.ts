import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular';

@Component({
  selector: 'app-skeleton-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonSkeletonText],
  templateUrl: './skeleton-card.html',
  styleUrl: './skeleton-card.scss',
})
export class SkeletonCard {}
