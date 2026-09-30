import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PokemonCard } from './pokemon-card';

describe('PokemonCard', () => {
  async function render(inputs: {
    id: number;
    name: string;
    types?: string[];
  }): Promise<ComponentFixture<PokemonCard>> {
    const fixture = TestBed.createComponent(PokemonCard);
    fixture.componentRef.setInput('id', inputs.id);
    fixture.componentRef.setInput('name', inputs.name);
    fixture.componentRef.setInput('artworkUrl', 'art.png');
    if (inputs.types) {
      fixture.componentRef.setInput('types', inputs.types);
    }
    await fixture.whenStable();
    return fixture;
  }

  it('shows the zero-padded number and the name', async () => {
    const fixture = await render({ id: 25, name: 'Pikachu' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.number')?.textContent).toContain('#025');
    expect(el.querySelector('.name')?.textContent).toContain('Pikachu');
  });

  it('keeps a Form its raw 5-digit id', async () => {
    const fixture = await render({ id: 10001, name: 'Deoxys Attack' });
    expect((fixture.nativeElement as HTMLElement).querySelector('.number')?.textContent).toContain(
      '#10001',
    );
  });

  it('stays neutral when no types are given', async () => {
    const fixture = await render({ id: 1, name: 'Bulbasaur' });
    const card = (fixture.nativeElement as HTMLElement).querySelector('.card') as HTMLElement;
    expect(card.getAttribute('style')).toContain('--pkx-surface');
  });

  it('fills with the primary Type colour when types are supplied', async () => {
    const fixture = await render({ id: 6, name: 'Charizard', types: ['fire', 'flying'] });
    const card = (fixture.nativeElement as HTMLElement).querySelector('.card') as HTMLElement;
    expect(card.getAttribute('style')).toContain('--pkx-type-fire');
  });

  it('adds the tinted class and Type shadow rgb once the primary Type is known', async () => {
    const fixture = await render({ id: 6, name: 'Charizard', types: ['fire', 'flying'] });
    const card = (fixture.nativeElement as HTMLElement).querySelector('.card') as HTMLElement;
    expect(card.classList.contains('tinted')).toBe(true);
    expect(card.getAttribute('style')).toContain('--pkx-type-fire-rgb');
  });

  it('re-colours already-rendered cards when the types input lands after first render', async () => {
    const fixture = await render({ id: 6, name: 'Charizard' });
    const card = (fixture.nativeElement as HTMLElement).querySelector('.card') as HTMLElement;
    expect(card.classList.contains('tinted')).toBe(false);

    fixture.componentRef.setInput('types', ['fire']);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(card.classList.contains('tinted')).toBe(true);
    expect(card.getAttribute('style')).toContain('--pkx-type-fire');
  });
});
