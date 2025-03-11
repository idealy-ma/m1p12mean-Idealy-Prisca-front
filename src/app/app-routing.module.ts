import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccueilComponent } from './page/accueil/accueil.component';
import { InscriptionComponent } from './page/inscription/inscription.component';
import { LoginComponent } from './page/login/login.component';
import { RoleGuard } from './services/role.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: InscriptionComponent },
  
  // Route pour les clients (rôle: client)
  { 
    path: '', 
    component: AccueilComponent, 
    canActivate: [RoleGuard],
    data: { role: 'client' }
  },
  
  // Route pour les managers (rôle: manager)
  { 
    path: 'manager', 
    component: AccueilComponent, // Remplacer par le composant spécifique au manager
    canActivate: [RoleGuard],
    data: { role: 'manager' }
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
