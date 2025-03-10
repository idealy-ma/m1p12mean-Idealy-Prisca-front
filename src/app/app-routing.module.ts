import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccueilComponent } from './page/accueil/accueil.component';
import { LoginComponent } from './page/login/login.component';
import { AuthGuard } from './services/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'accueil', component: AccueilComponent, canActivate: [AuthGuard]},
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Page par défaut
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
