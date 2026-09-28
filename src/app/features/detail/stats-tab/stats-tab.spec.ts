import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatSet } from '../../../domain/stat-set';
import { StatsTab } from './stats-tab';

const stats: StatSet = {
  hp: 45,
  attack: 49,
  defense: 49,
  specialAttack: 65,
  specialDefense: 65,
  speed: 45,
  total: 318,
};

describe('StatsTab', () => {
  async function render(): Promise<ComponentFixture<StatsTab>> {
    const fixture = TestBed.createComponent(StatsTab);
    fixture.componentRef.setInput('stats', stats);
    await fixture.whenStable();
    return fixture;
  }

  it('renders the six base stats as bars', async () => {
    const fixture = await render();
    const bars = (fixture.nativeElement as HTMLElement).querySelectorAll('app-stat-bar');
    expect(bars.length).toBe(6);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sp. Atk');
  });

  it('shows the total on its own row', async () => {
    const fixture = await render();
    const total = (fixture.nativeElement as HTMLElement).querySelector('.total');
    expect(total?.textContent).toContain('Total');
    expect(total?.textContent).toContain('318');
  });
});
