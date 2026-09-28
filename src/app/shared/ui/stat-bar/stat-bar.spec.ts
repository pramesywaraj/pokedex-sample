import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatBar } from './stat-bar';

describe('StatBar', () => {
  async function render(
    label: string,
    value: number,
    max?: number,
  ): Promise<ComponentFixture<StatBar>> {
    const fixture = TestBed.createComponent(StatBar);
    fixture.componentRef.setInput('label', label);
    fixture.componentRef.setInput('value', value);
    if (max !== undefined) {
      fixture.componentRef.setInput('max', max);
    }
    await fixture.whenStable();
    return fixture;
  }

  it('shows the label and value', async () => {
    const fixture = await render('HP', 45);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.label')?.textContent).toContain('HP');
    expect(el.querySelector('.value')?.textContent).toContain('45');
  });

  it('sizes the fill in proportion to the max', async () => {
    const fixture = await render('Attack', 75, 150);
    const fill = (fixture.nativeElement as HTMLElement).querySelector('.fill') as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });

  it('caps the fill at a full bar when the stat exceeds the max', async () => {
    const fixture = await render('HP', 255, 150);
    const fill = (fixture.nativeElement as HTMLElement).querySelector('.fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });
});
