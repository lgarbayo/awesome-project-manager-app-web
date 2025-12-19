import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./page/landing-page/landing-page').then(c => c.LandingPage)
    },
    {
        path: 'list',
        loadComponent: () => import('./page/project-list-page/project-list-page').then(c => c.ProjectListPage)
    },
    {
        path: 'project/:projectUuid',
        loadComponent: () => import('./page/project-detail-page/project-detail-page').then(c => c.ProjectDetailPage)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
