import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pokemon } from '../../../domain/pokemon';
import { DescriptionStatus } from '../../../application/detail.service';
import { AboutTab } from './about-tab';

function pokemon(): Pokemon {
  return {
    id: 1,
    speciesId: 1,
    name: 'Bulbasaur',
    types: ['grass', 'poison'],
    heightM: 0.7,
    weightKg: 6.9,
    stats: {
      hp: 45,
      attack: 49,
      defense: 49,
      specialAttack: 65,
      specialDefense: 65,
      speed: 45,
      total: 318,
    },
    abilities: ['Overgrow', 'Chlorophyll'],
    artworkUrl: 'art.png',
    frontSpriteUrl: 'front.png',
    backSpriteUrl: 'back.png',
  };
}

describe('AboutTab', () => {
  async function render(opts: {
    description?: string;
    status: DescriptionStatus;
  }): Promise<ComponentFixture<AboutTab>> {
    const fixture = TestBed.createComponent(AboutTab);
    fixture.componentRef.setInput('pokemon', pokemon());
    fixture.componentRef.setInput('description', opts.description);
    fixture.componentRef.setInput('descriptionStatus', opts.status);
    await fixture.whenStable();
    return fixture;
  }

  it('shows height, weight and abilities from the Pokémon', async () => {
    const fixture = await render({ status: 'ready', description: 'A seed sleeps.' });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('0.7 m');
    expect(text).toContain('6.9 kg');
    expect(text).toContain('Overgrow · Chlorophyll');
  });

  it('shows the description when it is ready', async () => {
    const fixture = await render({ status: 'ready', description: 'A seed sleeps.' });
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.description')?.textContent,
    ).toContain('A seed sleeps.');
  });

  it('shows a per-tab retry when the description failed, keeping the rest', async () => {
    const fixture = await render({ status: 'error' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.description-error')).not.toBeNull();
    expect(el.textContent).toContain('0.7 m');
  });

  it('emits retryDescription when the retry is pressed', async () => {
    const fixture = await render({ status: 'error' });
    let retried = false;
    fixture.componentInstance.retryDescription.subscribe(() => (retried = true));
    (fixture.nativeElement as HTMLElement)
      .querySelector('.description-error ion-button')
      ?.dispatchEvent(new Event('click'));
    expect(retried).toBe(true);
  });
});
