import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { DashboardComponent } from './app/features/dashboard/dashboard.component';
import { PermissionManagementComponent } from './app/features/permissions/permission-management.component';
import { RolePermissionAssignmentComponent } from './app/features/permissions/role-permission-assignment.component';
import { EmptyRouteComponent } from './app/layout/empty-route/empty-route.component';

bootstrapApplication(AppComponent, {
  providers: [provideRouter([
    { path: '', component: EmptyRouteComponent, pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'permissions', component: PermissionManagementComponent },
    { path: 'role-permissions', component: RolePermissionAssignmentComponent },
    { path: '**', redirectTo: '' }
  ])]
}).catch(err => console.error(err));
