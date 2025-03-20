import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccueilComponent } from './page/accueil/accueil.component';
import { InscriptionComponent } from './page/inscription/inscription.component';
import { LoginComponent } from './page/login/login.component';
import { ManagerLoginComponent } from './page/manager/login/login.component';
import { MecanicienLoginComponent } from './page/mecanicien/login/login.component';
import { UnauthorizedComponent } from './page/unauthorized/unauthorized.component';
import { RoleGuard } from './services/role.guard';
import { AuthGuard } from './services/auth.guard';
import { AddVehiculeComponent } from './page/add-vehicule/add-vehicule.component';
import { DevisListComponent } from './page/manager/devis-list/devis-list.component';
import { DevisDetailsComponent } from './page/manager/devis-details/devis-details.component';
import { AccueilManagerComponent } from './page/manager/accueil/accueil-manager.component';
import { ManagerLayoutComponent } from './components/manager/layout/manager-layout.component';
import { AddServiceComponent } from './page/manager/add-service/add-service.component';
import { AddEmployeeComponent } from './page/manager/add-employee/add-employee.component';
import { EmployeeListComponent } from './page/manager/employee-list/employee-list.component';

const routes: Routes = [
  // Routes publiques
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard] },
  { path: 'register', component: InscriptionComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  
  // Routes spécifiques aux rôles
  { path: 'manager/login', component: ManagerLoginComponent, canActivate: [AuthGuard] },
  { path: 'mecanicien/login', component: MecanicienLoginComponent, canActivate: [AuthGuard] },
  
  // Route pour les clients (rôle: client)
  { path: 'client/addvehicules', component: AddVehiculeComponent, canActivate: [RoleGuard] },
  { 
    path: '', 
    component: AccueilComponent, 
    canActivate: [RoleGuard],
    data: { role: 'client' }
  },
  
  // Routes pour les managers (rôle: manager) avec mise en page partagée
  {
    path: 'manager',
    component: ManagerLayoutComponent,
    canActivate: [RoleGuard],
    data: { role: 'manager' },
    children: [
      {
        path: '',
        component: AccueilManagerComponent
      },
      {
        path: 'devis',
        component: DevisListComponent
      },
      {
        path: 'devis/:id',
        component: DevisDetailsComponent
      },
      {
        path: 'service',
        component: AddServiceComponent
      },
      {
        path: 'employee',
        component: AddEmployeeComponent
      },
      {
        path: 'employees',
        component: EmployeeListComponent
      }
    ]
  },
  
  // Route pour les mécaniciens (rôle: mecanicien)
  { 
    path: 'mecanicien', 
    component: AccueilComponent, // Remplacer par le composant spécifique au mécanicien
    canActivate: [RoleGuard],
    data: { role: 'mecanicien' }
  },
  
  // Redirection par défaut
  { path: '**', redirectTo: '/login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
