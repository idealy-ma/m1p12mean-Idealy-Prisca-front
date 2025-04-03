import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InscriptionComponent } from './page/inscription/inscription.component';
import { LoginComponent } from './page/login/login.component';
import { ManagerLoginComponent } from './page/manager/login/login.component';
import { MecanicienLoginComponent } from './page/mecanicien/login/login.component';
import { UnauthorizedComponent } from './page/unauthorized/unauthorized.component';
import { RoleGuard } from './services/role.guard';
import { AuthGuard } from './services/auth.guard';
import { DevisListComponent } from './page/manager/devis-list/devis-list.component';
import { DevisDetailsComponent } from './page/manager/devis-details/devis-details.component';
import { AccueilManagerComponent } from './page/manager/accueil/accueil-manager.component';
import { ManagerLayoutComponent } from './components/manager/layout/manager-layout.component';
import { AddServiceComponent } from './page/manager/add-service/add-service.component';
import { AddEmployeeComponent } from './page/manager/add-employee/add-employee.component';
import { EmployeeListComponent } from './page/manager/employee-list/employee-list.component';
import { MecanicienLayoutComponent } from './components/mecanicien/layout/mecanicien-layout/mecanicien-layout.component';
import { AccueilMecanicienComponent } from './page/mecanicien/accueil/accueil-mecanicien/accueil-mecanicien.component';
import { ClientLayoutComponent } from './components/client/layout/client-layout/client-layout.component';
import { LandingPageComponent } from './page/landing-page/landing-page.component';
import { VehiculeListComponent } from './page/client/vehicule-list/vehicule-list.component';
import { AddVehiculeComponent } from './page/client/add-vehicule/add-vehicule.component';
import { DevisRequestComponent } from './page/client/devis-request/devis-request.component';
import { ClientDevisListComponent } from './page/client/devis-list/devis-list.component';
import { ClientDevisDetailsComponent } from './page/client/devis-details/devis-details.component';
import { ClientDashboardComponent } from './page/client/dashboard/client-dashboard.component';
import { UserProfileComponent } from './page/client/profile/user-profile.component';
import { ReparationsListComponent } from './page/mecanicien/reparations/reparations-list/reparations-list.component';
import { ReparationDetailsComponent } from './page/mecanicien/reparations/reparation-details/reparation-details.component';
import { ClientReparationListComponent } from './page/client/reparations/reparation-list/client-reparation-list.component';
import { ClientReparationDetailsComponent } from './page/client/reparations/reparation-details/client-reparation-details.component';

// Ajout des imports pour les composants de facturation Manager
import { ManagerFacturesListComponent } from './page/manager/factures-list/manager-factures-list/manager-factures-list.component';
import { ManagerFactureDetailsComponent } from './page/manager/facture-details/manager-facture-details/manager-facture-details.component';

// Ajout des imports pour les composants de facturation Client
import { ClientFacturesListComponent } from './page/client/factures-list/client-factures-list/client-factures-list.component';
import { ClientFactureDetailsComponent } from './page/client/facture-details/client-facture-details/client-facture-details.component';

import { ManagerReparationDetailsComponent } from './page/manager/reparations/manager-reparation-details/manager-reparation-details.component';

// Importer le nouveau composant de liste
import { ManagerReparationsListComponent } from './page/manager/reparations/manager-reparations-list/manager-reparations-list.component';

const routes: Routes = [
  // Landing page (page principale)
  { path: '', component: LandingPageComponent, pathMatch: 'full' },
  
  // Routes publiques
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard] },
  { path: 'register', component: InscriptionComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  
  // Routes spécifiques aux rôles
  { path: 'manager/login', component: ManagerLoginComponent, canActivate: [AuthGuard] },
  { path: 'mecanicien/login', component: MecanicienLoginComponent, canActivate: [AuthGuard] },
  
  // Routes client avec mise en page partagée
  {
    path: 'client',
    component: ClientLayoutComponent,
    canActivate: [RoleGuard],
    data: { role: 'client' },
    children: [
      { path: '', component: ClientDashboardComponent },
      { path: 'vehicules', component: VehiculeListComponent },
      { path: 'addvehicules', component: AddVehiculeComponent },
      { path: 'profil', component: UserProfileComponent },
      { path: 'devis/demande', component: DevisRequestComponent },
      { path: 'devis', component: ClientDevisListComponent },
      { path: 'devis/:id', component: ClientDevisDetailsComponent },
      { path: 'reparations', component: ClientReparationListComponent },
      { path: 'reparations/:id', component: ClientReparationDetailsComponent },
      { path: 'factures', component: ClientFacturesListComponent },
      { path: 'factures/:id', component: ClientFactureDetailsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Routes pour les managers (rôle: manager) avec mise en page partagée
  {
    path: 'manager',
    component: ManagerLayoutComponent,
    canActivate: [RoleGuard],
    data: { role: 'manager' },
    children: [
      { path: '', component: AccueilManagerComponent },
      { path: 'devis', component: DevisListComponent },
      { path: 'devis/:id', component: DevisDetailsComponent },
      { path: 'reparations', component: ManagerReparationsListComponent },
      {
        path: 'reparations/:id',
        component: ManagerReparationDetailsComponent,
      },
      { path: 'service', component: AddServiceComponent },
      { path: 'employee', component: AddEmployeeComponent },
      { path: 'employees', component: EmployeeListComponent },
      { path: 'profil', component: UserProfileComponent },
      { path: 'factures', component: ManagerFacturesListComponent },
      { path: 'factures/:id', component: ManagerFactureDetailsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Route pour les mécaniciens (rôle: mecanicien)
  {
    path: 'mecanicien',
    component: MecanicienLayoutComponent,
    canActivate: [RoleGuard],
    data: { roles: ['mecanicien'] },
    children: [
      { path: '', component: AccueilMecanicienComponent },
      { path: 'reparations', component: ReparationsListComponent },
      { path: 'reparations/:id', component: ReparationDetailsComponent },
      { path: 'profile', component: UserProfileComponent }
    ]
  },
  
  // Redirection par défaut si aucune route ne correspond
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
