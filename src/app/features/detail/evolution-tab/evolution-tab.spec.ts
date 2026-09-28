import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvolutionStatus } from '../../../application/detail.service';
import { EvolutionChain } from '../../../domain/evolution';
import { Pokemon } from '../../../domain/pokemon';
import { EvolutionTab } from './evolution-tab';

function pokemon(speciesId = 1): Pokemon {
  return {
    id: speciesId,
    speciesId,
    name: 'Bulbasaur',
    types: ['grass'],
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
    abilities: ['Overgrow'],
    artworkUrl: 'art/1.png',
    frontSpriteUrl: 'front/1.png',
    backSpriteUrl: 'back/1.png',
  };
}

const chain: EvolutionChain = {
  chainId: 1,
  steps: [
    {
      from: { speciesId: 1, name: 'Bulbasaur', artworkUrl: 'art/1.png' },
      to: { speciesId: 2, name: 'Ivysaur', artworkUrl: 'art/2.png' },
      method: 'Lv. 16',
    },
    {
      from: { speciesId: 2, name: 'Ivysaur', artworkUrl: 'art/2.png' },
      to: { speciesId: 3, name: 'Venusaur', artworkUrl: 'art/3.png' },
      method: 'Lv. 32',
    },
  ],
};

describe('EvolutionTab', () => {
  async function render(opts: {
    status: EvolutionStatus;
    chain?: EvolutionChain;
    speciesId?: number;
  }): Promise<ComponentFixture<EvolutionTab>> {
    const fixture = TestBed.createComponent(EvolutionTab);
    fixture.componentRef.setInput('pokemon', pokemon(opts.speciesId ?? 1));
    fixture.componentRef.setInput('status', opts.status);
    fixture.componentRef.setInput('chain', opts.chain);
    await fixture.whenStable();
    return fixture;
  }

  it('lays out one row per step with the method label', async () => {
    const fixture = await render({ status: 'ready', chain });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.row').length).toBe(2);
    expect(el.textContent).toContain('Lv. 16');
    expect(el.textContent).toContain('Venusaur');
  });

  it('marks the current Pokémon among the stages', async () => {
    const fixture = await render({ status: 'ready', chain, speciesId: 1 });
    const current = (fixture.nativeElement as HTMLElement).querySelectorAll('.stage.current');
    // Bulbasaur appears once as a "from" stage and is the current Pokémon.
    expect(current.length).toBeGreaterThanOrEqual(1);
  });

  it('shows the does-not-evolve note for a lone Pokémon', async () => {
    const fixture = await render({ status: 'ready', chain: { chainId: 9, steps: [] } });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dne-title')?.textContent).toContain('does not evolve');
    expect(el.querySelector('.dne-sub')?.textContent).toContain('Bulbasaur stands alone');
    expect(el.querySelector('.row')).toBeNull();
  });

  it('shows a per-tab retry on error', async () => {
    const fixture = await render({ status: 'error' });
    let retried = false;
    fixture.componentInstance.retry.subscribe(() => (retried = true));
    (fixture.nativeElement as HTMLElement)
      .querySelector('.tab-error ion-button')
      ?.dispatchEvent(new Event('click'));
    expect(retried).toBe(true);
  });

  it('bubbles a tapped stage id out', async () => {
    const fixture = await render({ status: 'ready', chain });
    let picked: number | undefined;
    fixture.componentInstance.selectStage.subscribe((id) => (picked = id));
    // The second stage in row one is Ivysaur (#2), which is navigable.
    const stages = (fixture.nativeElement as HTMLElement).querySelectorAll('.stage');
    (
      Array.from(stages).find((s) => s.textContent?.includes('Ivysaur')) as HTMLButtonElement
    ).click();
    expect(picked).toBe(2);
  });
});
