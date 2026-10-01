import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { hideSplash } from './app/core/splash/splash';

// The cover comes down even if bootstrap fails, so it never hides a broken page.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err))
  .finally(() => hideSplash());
