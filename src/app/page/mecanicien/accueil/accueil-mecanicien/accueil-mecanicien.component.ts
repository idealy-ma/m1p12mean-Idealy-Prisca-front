import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accueil-mecanicien',
  templateUrl: './accueil-mecanicien.component.html',
  styleUrls: ['./accueil-mecanicien.component.css']
})
export class AccueilMecanicienComponent implements OnInit {

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  goToTasks(): void {
    this.router.navigate(['/mecanicien/taches']);
  }

  goToRepairs(): void {
    this.router.navigate(['/mecanicien/reparations']);
  }

  goToHistory(): void {
    this.router.navigate(['/mecanicien/historique']);
  }

  goToProfile(): void {
    this.router.navigate(['/mecanicien/profil']);
  }
}
