import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './page/login/login.component';
import { InscriptionComponent } from './page/inscription/inscription.component';
import { ManagerLoginComponent } from './page/manager/login/login.component';
import { MecanicienLoginComponent } from './page/mecanicien/login/login.component';
import { UnauthorizedComponent } from './page/unauthorized/unauthorized.component';
import { AuthInterceptorService } from './services/interceptor/auth-interceptor.service';
import { ErrorInterceptorService } from './services/interceptor/error-interceptor.service';
import { ErrorMessageComponent } from './components/error-message/error-message.component';
import { DevisListComponent } from './page/manager/devis-list/devis-list.component';
import { DevisDetailsComponent } from './page/manager/devis-details/devis-details.component';
import { AccueilManagerComponent } from './page/manager/accueil/accueil-manager.component';
import { ManagerSidebarComponent } from './components/manager/sidebar/manager-sidebar.component';
import { SidebarLayoutComponent } from './components/shared/layout/sidebar-layout.component';
import { ManagerLayoutComponent } from './components/manager/layout/manager-layout.component';
import { AddServiceComponent } from './page/manager/add-service/add-service.component';
import { AddEmployeeComponent } from './page/manager/add-employee/add-employee.component';
import { EmployeeListComponent } from './page/manager/employee-list/employee-list.component';
import { SuccessMessageComponent } from './components/success-message/success-message.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { MecanicienLayoutComponent } from './components/mecanicien/layout/mecanicien-layout/mecanicien-layout.component';
import { MecanicienSidebarComponent } from './components/mecanicien/sidebar/mecanicien-sidebar/mecanicien-sidebar.component';
import { AccueilMecanicienComponent } from './page/mecanicien/accueil/accueil-mecanicien/accueil-mecanicien.component';
import { ClientLayoutComponent } from './components/client/layout/client-layout/client-layout.component';
import { ClientSidebarComponent } from './components/client/sidebar/client-sidebar/client-sidebar.component';
import { LandingPageComponent } from './page/landing-page/landing-page.component';
import { VehiculeListComponent } from './page/client/vehicule-list/vehicule-list.component';
import { ClientDashboardComponent } from './page/client/dashboard/client-dashboard.component';
import { AddVehiculeComponent } from './page/client/add-vehicule/add-vehicule.component';
import { UserProfileComponent } from './page/client/profile/user-profile.component';
import { DevisRequestComponent } from './page/client/devis-request/devis-request.component';
import { ClientDevisListComponent } from './page/client/devis-list/devis-list.component';
import { ClientDevisDetailsComponent } from './page/client/devis-details/devis-details.component';
import { ReparationsListComponent } from './page/mecanicien/reparations/reparations-list/reparations-list.component';
import { ReparationDetailsComponent } from './page/mecanicien/reparations/reparation-details/reparation-details.component';
import { ClientReparationListComponent } from './page/client/reparations/reparation-list/client-reparation-list.component';
import { ClientReparationDetailsComponent } from './page/client/reparations/reparation-details/client-reparation-details.component';
import { ManagerFacturesListComponent } from './page/manager/factures-list/manager-factures-list/manager-factures-list.component';
import { ManagerFactureDetailsComponent } from './page/manager/facture-details/manager-facture-details/manager-facture-details.component';
import { ClientFacturesListComponent } from './page/client/factures-list/client-factures-list/client-factures-list.component';
import { ClientFactureDetailsComponent } from './page/client/facture-details/client-facture-details/client-facture-details.component';
import { ManagerReparationDetailsComponent } from './page/manager/reparations/manager-reparation-details/manager-reparation-details.component';
import { ManagerReparationsListComponent } from './page/manager/reparations/manager-reparations-list/manager-reparations-list.component';
import { HistoriqueReparationsComponent } from './page/mecanicien/historique-reparations/historique-reparations/historique-reparations.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    InscriptionComponent,
    ManagerLoginComponent,
    MecanicienLoginComponent,
    UnauthorizedComponent,
    ErrorMessageComponent,
    AddVehiculeComponent,
    DevisListComponent,
    DevisDetailsComponent,
    AccueilManagerComponent,
    ManagerSidebarComponent,
    SidebarLayoutComponent,
    ManagerLayoutComponent,
    AddServiceComponent,
    AddEmployeeComponent,
    EmployeeListComponent,
    SuccessMessageComponent,
    ConfirmationDialogComponent,
    MecanicienLayoutComponent,
    MecanicienSidebarComponent,
    AccueilMecanicienComponent,
    ClientLayoutComponent,
    ClientSidebarComponent,
    ClientDashboardComponent,
    UserProfileComponent,
    LandingPageComponent,
    VehiculeListComponent,
    DevisRequestComponent,
    ClientDevisListComponent,
    ClientDevisDetailsComponent,
    ReparationsListComponent,
    ReparationDetailsComponent,
    ClientReparationListComponent,
    ClientReparationDetailsComponent,
    ManagerFacturesListComponent,
    ManagerFactureDetailsComponent,
    ClientFacturesListComponent,
    ClientFactureDetailsComponent,
    ManagerReparationDetailsComponent,
    ManagerReparationsListComponent,
    HistoriqueReparationsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptorService,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
