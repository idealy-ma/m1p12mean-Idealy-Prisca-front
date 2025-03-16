import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accueil-manager',
  templateUrl: './accueil-manager.component.html',
  styleUrls: ['./accueil-manager.component.css']
})
export class AccueilManagerComponent implements OnInit {

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialisation du composant
  }

  goToDevisList(): void {
    this.router.navigate(['/manager/devis']);
  }
} 