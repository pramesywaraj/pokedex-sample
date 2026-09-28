import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The faint twin Poké Ball watermark that textures a detail panel, a large ball
 * bleeding off the top-right and a small one lower-left. A dumb decorative layer,
 * it fills its positioned parent and takes no input.
 */
@Component({
  selector: 'app-pokeball-backdrop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pokeball-backdrop.html',
  styleUrl: './pokeball-backdrop.scss',
})
export class PokeballBackdrop {}
