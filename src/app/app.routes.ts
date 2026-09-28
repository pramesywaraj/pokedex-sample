import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./features/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'browse',
        loadComponent: () => import('./features/browse/browse.page').then((m) => m.BrowsePage),
      },
      {
        path: 'favourites',
        loadComponent: () =>
          import('./features/favourites/favourites.page').then((m) => m.FavouritesPage),
      },
      { path: '', redirectTo: 'browse', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'tabs/browse', pathMatch: 'full' },
];
