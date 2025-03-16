import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/authentification/auth.service';

@Component({
  selector: 'app-accueil-manager',
  templateUrl: './accueil-manager.component.html',
  styleUrls: ['./accueil-manager.component.css']
})
export class AccueilManagerComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialisation du composant
  }

  goToDevisList(): void {
    this.router.navigate(['/manager/devis']);
  }

  logout(): void {
    this.authService.logout();
  }
} 