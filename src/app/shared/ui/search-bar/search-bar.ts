import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

/**
 * The pill shaped search bar at the top of the Browse feed. A dumb primitive,
 * disabled and hinted while its data isn't ready, and emitting a debounced
 * queryChange the feed listens to.
 */
@Component({
  selector: 'app-search-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBar {
  /** Disables typing and swaps the placeholder to the loading hint. */
  readonly disabled = input(false);
  /** Placeholder text when the bar is enabled. */
  readonly placeholder = input('Search Pokémon by Name or Dex Number');
  /** Hint shown in place of the placeholder while disabled. */
  readonly loadingHint = input('Loading Pokémon…');
  /** Debounced query changes. Fires on both typing and clearing. */
  readonly queryChange = output<string>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly input$ = new Subject<string>();
  protected readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  constructor() {
    this.input$
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.queryChange.emit(value));
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.input$.next(value);
  }

  /** Clears the input and emits an empty query so the feed drops search mode. */
  clear(): void {
    const el = this.field()?.nativeElement;
    if (el) {
      el.value = '';
    }
    this.input$.next('');
  }
}
