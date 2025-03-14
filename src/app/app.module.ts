import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './page/login/login.component';
import { InscriptionComponent } from './page/inscription/inscription.component';
import { AccueilComponent } from './page/accueil/accueil.component';
import { ManagerLoginComponent } from './page/manager/login/login.component';
import { MecanicienLoginComponent } from './page/mecanicien/login/login.component';
import { UnauthorizedComponent } from './page/unauthorized/unauthorized.component';
import { AuthInterceptorService } from './services/interceptor/auth-interceptor.service';
import { ErrorInterceptorService } from './services/interceptor/error-interceptor.service';
import { ErrorMessageComponent } from './components/error-message/error-message.component';
import { AddVehiculeComponent } from './page/add-vehicule/add-vehicule.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    InscriptionComponent,
    AccueilComponent,
    ManagerLoginComponent,
    MecanicienLoginComponent,
    UnauthorizedComponent,
    ErrorMessageComponent,
    AddVehiculeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
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
