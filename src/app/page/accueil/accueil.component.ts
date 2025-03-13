import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authentification/auth.service';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css']
})
export class AccueilComponent{

  constructor(private authService: AuthService,private router: Router) {}

  logout(): void {
    this.authService.logout();
  }
  goToAddVehicule(): void {
    this.router.navigate(['/client/addvehicules']);
  }
}
