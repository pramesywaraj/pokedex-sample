import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailTab, DetailTabs } from './detail-tabs';

describe('DetailTabs', () => {
  async function render(active: DetailTab): Promise<ComponentFixture<DetailTabs>> {
    const fixture = TestBed.createComponent(DetailTabs);
    fixture.componentRef.setInput('active', active);
    await fixture.whenStable();
    return fixture;
  }

  function tab(fixture: ComponentFixture<DetailTabs>, label: string): HTMLButtonElement {
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.tab'),
    ) as HTMLButtonElement[];
    return buttons.find((b) => b.textContent?.trim() === label)!;
  }

  it('marks the active tab selected', async () => {
    const fixture = await render('stats');
    expect(tab(fixture, 'Base Stats').getAttribute('aria-selected')).toBe('true');
    expect(tab(fixture, 'About').getAttribute('aria-selected')).toBe('false');
  });

  it('emits the tapped tab', async () => {
    const fixture = await render('about');
    let picked: DetailTab | undefined;
    fixture.componentInstance.tabChange.subscribe((t) => (picked = t));
    tab(fixture, 'Base Stats').click();
    expect(picked).toBe('stats');
  });

  it('does not emit when the active tab is tapped again', async () => {
    const fixture = await render('about');
    let picked: DetailTab | undefined;
    fixture.componentInstance.tabChange.subscribe((t) => (picked = t));
    tab(fixture, 'About').click();
    expect(picked).toBeUndefined();
  });
});
