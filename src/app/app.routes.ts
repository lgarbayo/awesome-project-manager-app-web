import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list'
    },
    {
        path: 'list',
        loadComponent: () => import('./page/project-list-page/project-list-page').then(c => c.ProjectListPage)
    },
    {
        path: 'project/:projectUuid',
        loadComponent: () => import('./page/project-detail-page/project-detail-page').then(c => c.ProjectDetailPage)
    }
];
