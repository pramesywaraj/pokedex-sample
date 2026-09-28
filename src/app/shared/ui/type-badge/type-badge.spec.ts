import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PokemonTypeName } from '../../../domain/pokemon-type-name';
import { TypeBadge } from './type-badge';

describe('TypeBadge', () => {
  async function render(
    type: PokemonTypeName,
    variant?: 'primary' | 'solid',
  ): Promise<ComponentFixture<TypeBadge>> {
    const fixture = TestBed.createComponent(TypeBadge);
    fixture.componentRef.setInput('type', type);
    if (variant) {
      fixture.componentRef.setInput('variant', variant);
    }
    await fixture.whenStable();
    return fixture;
  }

  it('shows the title-cased Type name', async () => {
    const fixture = await render('grass');
    expect((fixture.nativeElement as HTMLElement).querySelector('.badge')?.textContent).toContain(
      'Grass',
    );
  });

  it('tints a solid pill with the Type colour', async () => {
    const fixture = await render('poison', 'solid');
    const badge = (fixture.nativeElement as HTMLElement).querySelector('.badge') as HTMLElement;
    expect(badge.classList.contains('primary')).toBe(false);
    expect(badge.getAttribute('style')).toContain('--pkx-type-poison');
  });

  it('marks the primary pill so it renders translucent-white on the header', async () => {
    const fixture = await render('grass', 'primary');
    const badge = (fixture.nativeElement as HTMLElement).querySelector('.badge') as HTMLElement;
    expect(badge.classList.contains('primary')).toBe(true);
  });
});
