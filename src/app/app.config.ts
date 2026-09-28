import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { errorNormaliseInterceptor } from './core/interceptors/error-normalise.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIonicAngular({}),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorNormaliseInterceptor])),
  ],
};
