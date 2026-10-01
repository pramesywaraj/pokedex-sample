import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PokemonTypeName, pokemonTypeNames } from '../../../domain/pokemon-type-name';
import { TypeFilter } from './type-filter';

describe('TypeFilter', () => {
  async function render(
    active: PokemonTypeName | null = null,
  ): Promise<ComponentFixture<TypeFilter>> {
    const fixture = TestBed.createComponent(TypeFilter);
    fixture.componentRef.setInput('active', active);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  function chips(fixture: ComponentFixture<TypeFilter>): HTMLButtonElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.chip'),
    );
  }

  it('renders a leading All chip and one chip per Type', async () => {
    const fixture = await render();
    const rendered = chips(fixture);
    expect(rendered).toHaveLength(pokemonTypeNames.length + 1);
    expect(rendered[0].textContent?.trim()).toBe('All');
    expect(rendered[1].textContent?.trim()).toBe('Normal');
  });

  it('marks the All chip selected when nothing is active', async () => {
    const fixture = await render(null);
    const [allChip, firstType] = chips(fixture);
    expect(allChip.classList.contains('selected')).toBe(true);
    expect(firstType.classList.contains('selected')).toBe(false);
  });

  it('marks only the active Type chip selected', async () => {
    const fixture = await render('fire');
    const rendered = chips(fixture);
    const selected = rendered.filter((chip) => chip.classList.contains('selected'));
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent?.trim()).toBe('Fire');
  });

  it('tints each Type chip with the matching Type colour token', async () => {
    const fixture = await render();
    const fire = chips(fixture).find((chip) => chip.textContent?.trim() === 'Fire');
    expect(fire?.getAttribute('style')).toContain('--pkx-type-fire');
  });

  it('emits null when the All chip is tapped', async () => {
    const fixture = await render('fire');
    const picks: (PokemonTypeName | null)[] = [];
    fixture.componentInstance.pick.subscribe((value) => picks.push(value));
    chips(fixture)[0].click();
    expect(picks).toEqual([null]);
  });

  it('emits the Type name when a Type chip is tapped', async () => {
    const fixture = await render(null);
    const picks: (PokemonTypeName | null)[] = [];
    fixture.componentInstance.pick.subscribe((value) => picks.push(value));
    const water = chips(fixture).find((chip) => chip.textContent?.trim() === 'Water');
    water?.click();
    expect(picks).toEqual(['water']);
  });
});
