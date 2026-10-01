import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PokemonNav } from './pokemon-nav';

describe('PokemonNav', () => {
  interface Setup {
    enabled: boolean;
    indexReady?: boolean;
    prevId?: number;
    nextId?: number;
  }

  async function render(setup: Setup): Promise<ComponentFixture<PokemonNav>> {
    const fixture = TestBed.createComponent(PokemonNav);
    fixture.componentRef.setInput('enabled', setup.enabled);
    fixture.componentRef.setInput('indexReady', setup.indexReady ?? false);
    fixture.componentRef.setInput('prevId', setup.prevId);
    fixture.componentRef.setInput('nextId', setup.nextId);
    await fixture.whenStable();
    return fixture;
  }

  function chev(fixture: ComponentFixture<PokemonNav>, side: 'prev' | 'next'): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      `.chev-${side}`,
    ) as HTMLButtonElement;
  }

  it('enables both sides when nav is on, the index is ready, and neighbours exist', async () => {
    const fixture = await render({ enabled: true, indexReady: true, prevId: 1, nextId: 3 });
    expect(chev(fixture, 'prev').disabled).toBe(false);
    expect(chev(fixture, 'next').disabled).toBe(false);
  });

  it('disables the prev side at the start of the Dex', async () => {
    const fixture = await render({ enabled: true, indexReady: true, nextId: 2 });
    expect(chev(fixture, 'prev').disabled).toBe(true);
    expect(chev(fixture, 'next').disabled).toBe(false);
  });

  it('disables the next side at the end of the Dex', async () => {
    const fixture = await render({ enabled: true, indexReady: true, prevId: 1024 });
    expect(chev(fixture, 'prev').disabled).toBe(false);
    expect(chev(fixture, 'next').disabled).toBe(true);
  });

  it('leaves both sides disabled while the index is still loading', async () => {
    const fixture = await render({ enabled: true, indexReady: false });
    expect(chev(fixture, 'prev').disabled).toBe(true);
    expect(chev(fixture, 'next').disabled).toBe(true);
    const spinners = (fixture.nativeElement as HTMLElement).querySelectorAll('ion-spinner');
    expect(spinners.length).toBe(2);
  });

  it('dims both sides when nav is disabled from Favourites, Type filter, or search', async () => {
    const fixture = await render({ enabled: false, indexReady: true, prevId: 1, nextId: 3 });
    expect(chev(fixture, 'prev').disabled).toBe(true);
    expect(chev(fixture, 'next').disabled).toBe(true);
    expect(chev(fixture, 'prev').classList.contains('is-disabled')).toBe(true);
    expect(chev(fixture, 'next').classList.contains('is-disabled')).toBe(true);
  });

  it('emits prev when the previous side is tapped', async () => {
    const fixture = await render({ enabled: true, indexReady: true, prevId: 1, nextId: 3 });
    let picked: 'prev' | 'next' | undefined;
    fixture.componentInstance.prev.subscribe(() => (picked = 'prev'));
    fixture.componentInstance.next.subscribe(() => (picked = 'next'));
    chev(fixture, 'prev').click();
    expect(picked).toBe('prev');
  });

  it('emits next when the next side is tapped', async () => {
    const fixture = await render({ enabled: true, indexReady: true, prevId: 1, nextId: 3 });
    let picked: 'prev' | 'next' | undefined;
    fixture.componentInstance.prev.subscribe(() => (picked = 'prev'));
    fixture.componentInstance.next.subscribe(() => (picked = 'next'));
    chev(fixture, 'next').click();
    expect(picked).toBe('next');
  });
});
