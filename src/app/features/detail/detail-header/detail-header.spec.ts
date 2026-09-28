import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pokemon } from '../../../domain/pokemon';
import { DetailHeader } from './detail-header';

function pokemon(overrides: Partial<Pokemon> = {}): Pokemon {
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
    abilities: ['Overgrow'],
    artworkUrl: 'art.png',
    frontSpriteUrl: 'front.png',
    backSpriteUrl: 'back.png',
    ...overrides,
  };
}

describe('DetailHeader', () => {
  async function render(p: Pokemon, category?: string): Promise<ComponentFixture<DetailHeader>> {
    const fixture = TestBed.createComponent(DetailHeader);
    fixture.componentRef.setInput('pokemon', p);
    if (category) {
      fixture.componentRef.setInput('category', category);
    }
    await fixture.whenStable();
    return fixture;
  }

  it('shows the name, zero-padded number and category', async () => {
    const fixture = await render(pokemon(), 'Seed');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.name')?.textContent).toContain('Bulbasaur');
    expect(el.querySelector('.number')?.textContent).toContain('#001');
    expect(el.querySelector('.category')?.textContent).toContain('Seed');
  });

  it('renders a pill per Type, primary first', async () => {
    const fixture = await render(pokemon());
    const pills = (fixture.nativeElement as HTMLElement).querySelectorAll('app-type-badge');
    expect(pills.length).toBe(2);
  });

  it('shows the flip control and swaps to the back sprite when pressed', async () => {
    const fixture = await render(pokemon());
    const el = fixture.nativeElement as HTMLElement;
    const flip = el.querySelector('.flip') as HTMLButtonElement;
    expect(flip).not.toBeNull();
    expect(el.querySelector('.art img')?.getAttribute('src')).toBe('art.png');
    flip.click();
    await fixture.whenStable();
    expect(el.querySelector('.art img')?.getAttribute('src')).toBe('back.png');
  });

  it('hides the flip control when there is no back sprite', async () => {
    const fixture = await render(pokemon({ backSpriteUrl: null }));
    expect((fixture.nativeElement as HTMLElement).querySelector('.flip')).toBeNull();
  });

  it('emits back when the back control is pressed', async () => {
    const fixture = await render(pokemon());
    let backed = false;
    fixture.componentInstance.back.subscribe(() => (backed = true));
    (fixture.nativeElement as HTMLElement)
      .querySelector('.icon-btn')
      ?.dispatchEvent(new Event('click'));
    expect(backed).toBe(true);
  });
});
