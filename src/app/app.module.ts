import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module'; 
// Importations de Angular Material (si nécessaire)
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AccueilComponent } from './page/accueil/accueil.component';
import { LoginComponent } from './page/login/login.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptorService } from './services/interceptor/auth-interceptor.service';
import { InscriptionComponent } from './page/inscription/inscription.component';

@NgModule({
  declarations: [
    AppComponent,
    AccueilComponent, // Composant principal
    LoginComponent, InscriptionComponent
  ],
  imports: [
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserModule, // Module de base pour l'application Angular
    HttpClientModule, // Module pour effectuer des requêtes HTTP
  ],
  providers: [
    HttpClient,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true
    },
  ],
  bootstrap: [AppComponent], // Démarrage de l'application avec le composant principal
})
export class AppModule { }
