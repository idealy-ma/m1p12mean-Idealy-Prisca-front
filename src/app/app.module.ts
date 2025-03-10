import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

// Importations de Angular Material (si nécessaire)
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { HttpClientModule } from '@angular/common/http';

// Format de date personnalisé
export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@NgModule({
  declarations: [
    AppComponent, // Composant principal
  ],
  imports: [
    BrowserModule, // Module de base pour l'application Angular
    HttpClientModule, // Module pour effectuer des requêtes HTTP
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }, // Fournir le format de date personnalisé
  ],
  bootstrap: [AppComponent], // Démarrage de l'application avec le composant principal
})
export class AppModule { }
