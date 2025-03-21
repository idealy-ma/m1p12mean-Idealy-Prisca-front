import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/authentification/auth.service';

@Component({
  selector: 'app-mecanicien-sidebar',
  templateUrl: './mecanicien-sidebar.component.html',
  styleUrls: ['./mecanicien-sidebar.component.css']
})
export class MecanicienSidebarComponent implements OnInit {
  activeRoute: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.setActiveRoute(this.router.url);
    
    // S'abonner aux changements de route pour mettre à jour l'élément actif
    this.router.events.subscribe(() => {
      this.setActiveRoute(this.router.url);
    });
  }

  setActiveRoute(url: string): void {
    if (url === '/mecanicien') {
      this.activeRoute = 'dashboard';
    } else if (url.includes('/mecanicien/reparations')) {
      this.activeRoute = 'reparations';
    } else if (url.includes('/mecanicien/taches')) {
      this.activeRoute = 'taches';
    } else if (url.includes('/mecanicien/historique')) {
      this.activeRoute = 'historique';
    } else if (url.includes('/mecanicien/profil')) {
      this.activeRoute = 'profil';
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
  }
}
