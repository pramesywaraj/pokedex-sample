import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { CACHE, applyCacheVersion } from './data/cache/cache';
import { IonicStorageCache } from './data/cache/ionic-storage.cache';
import { FAVOURITES_STORE } from './data/favourites/favourites-store';
import { IonicStorageFavouritesStore } from './data/favourites/ionic-storage-favourites.store';
import { errorNormaliseInterceptor } from './core/interceptors/error-normalise.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIonicAngular({}),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorNormaliseInterceptor])),
    { provide: CACHE, useExisting: IonicStorageCache },
    { provide: FAVOURITES_STORE, useExisting: IonicStorageFavouritesStore },
    provideAppInitializer(() => applyCacheVersion(inject(CACHE))),
  ],
};
