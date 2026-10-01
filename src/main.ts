import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { StatusBarService } from './app/application/status-bar.service';
import { hideSplash } from './app/core/splash/splash';

// The cover comes down even if bootstrap fails, so it never hides a broken page.
bootstrapApplication(App, appConfig)
  .then((app) => app.injector.get(StatusBarService))
  .catch((err) => {
    console.error(err);
    return undefined;
  })
  .then(async (statusBar) => {
    await hideSplash();
    // The cover is brand red with white status bar icons, set by the native
    // launch theme, so the screen underneath only gets the bar once it has gone.
    statusBar?.bootCoverGone();
  });
