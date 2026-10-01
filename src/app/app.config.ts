import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { PokemonIndexService } from './application/pokemon-index.service';
import { CACHE, applyCacheVersion } from './data/cache/cache';
import { IonicStorageCache } from './data/cache/ionic-storage.cache';
import { FAVOURITES_STORE } from './data/favourites/favourites-store';
import { IonicStorageFavouritesStore } from './data/favourites/ionic-storage-favourites.store';
import { CONNECTIVITY } from './data/platform/connectivity';
import { platformConnectivity } from './data/platform/platform-connectivity';
import { HardwareBackService } from './core/hardware-back/hardware-back.service';
import { errorNormaliseInterceptor } from './core/interceptors/error-normalise.interceptor';
import { retryBackoffInterceptor } from './core/interceptors/retry-backoff.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIonicAngular({}),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorNormaliseInterceptor, retryBackoffInterceptor])),
    { provide: CACHE, useExisting: IonicStorageCache },
    { provide: FAVOURITES_STORE, useExisting: IonicStorageFavouritesStore },
    { provide: CONNECTIVITY, useFactory: platformConnectivity },
    provideAppInitializer(() => applyCacheVersion(inject(CACHE))),
    provideAppInitializer(() => {
      void inject(PokemonIndexService).load();
    }),
    provideAppInitializer(() => inject(HardwareBackService).start()),
  ],
};
