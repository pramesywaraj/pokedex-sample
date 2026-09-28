import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvolutionStage as Stage } from '../../../domain/evolution';
import { EvolutionStage } from './evolution-stage';

const bulbasaur: Stage = { speciesId: 1, name: 'Bulbasaur', artworkUrl: 'art/1.png' };

describe('EvolutionStage', () => {
  async function render(current = false): Promise<ComponentFixture<EvolutionStage>> {
    const fixture = TestBed.createComponent(EvolutionStage);
    fixture.componentRef.setInput('stage', bulbasaur);
    fixture.componentRef.setInput('current', current);
    await fixture.whenStable();
    return fixture;
  }

  it('shows the name and zero-padded number', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.name')?.textContent).toContain('Bulbasaur');
    expect(el.querySelector('.number')?.textContent).toContain('#001');
  });

  it('emits its species id when tapped', async () => {
    const fixture = await render();
    let picked: number | undefined;
    fixture.componentInstance.pick.subscribe((id) => (picked = id));
    (fixture.nativeElement as HTMLElement)
      .querySelector('.stage')
      ?.dispatchEvent(new Event('click'));
    expect(picked).toBe(1);
  });

  it('marks the current stage and stops it navigating to itself', async () => {
    const fixture = await render(true);
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '.stage',
    ) as HTMLButtonElement;
    expect(button.classList.contains('current')).toBe(true);
    expect(button.disabled).toBe(true);
  });
});
