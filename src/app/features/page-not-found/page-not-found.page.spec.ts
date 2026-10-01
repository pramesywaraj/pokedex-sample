import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideIonicAngular } from '@ionic/angular';
import { routes } from '../../app.routes';
import { PageNotFoundPage } from './page-not-found.page';

describe('PageNotFoundPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideIonicAngular({}), provideRouter(routes)],
    });
  });

  it('is what an unknown url lands on', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/no/such/place', PageNotFoundPage);
    expect(page).toBeInstanceOf(PageNotFoundPage);
  });

  it('also catches an unknown url under the tabs', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/tabs/nope', PageNotFoundPage);
    expect(page).toBeInstanceOf(PageNotFoundPage);
  });

  it('shows 404 with the Poké Ball as the zero, the title and the copy', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/no/such/place', PageNotFoundPage);
    const el = harness.routeNativeElement as HTMLElement;

    const code = el.querySelector('.code');
    expect(code?.getAttribute('aria-label')).toBe('404');
    expect(code?.querySelectorAll('.digit').length).toBe(2);
    expect(code?.querySelector('.ball')).not.toBeNull();
    expect(el.querySelector('.title')?.textContent).toContain('Page not found');
    expect(el.querySelector('.message')?.textContent).toContain(
      "This page slipped away into the tall grass. Let's get you back to safety.",
    );
  });

  it('sends the Trainer to Browse through the router', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/no/such/place', PageNotFoundPage);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const button = (harness.routeNativeElement as HTMLElement).querySelector('.cta') as HTMLElement;
    expect(button.textContent).toContain('Back to Browse');
    button.click();

    expect(navigate).toHaveBeenCalledWith(['/tabs/browse']);
  });
});
