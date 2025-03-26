import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/authentification/auth.service';

@Component({
  selector: 'app-client-sidebar',
  templateUrl: './client-sidebar.component.html',
  styleUrls: ['./client-sidebar.component.css']
})
export class ClientSidebarComponent implements OnInit {
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
    if (url === '/') {
      this.activeRoute = 'dashboard';
    } else if (url.includes('/vehicules')) {
      this.activeRoute = 'vehicules';
    } else if (url.includes('/client/devis/demande')) {
      this.activeRoute = 'devis-request';
    } else if (url.includes('/client/devis')) {
      this.activeRoute = 'devis';
    } else if (url.includes('/reparations')) {
      this.activeRoute = 'reparations';
    } else if (url.includes('/factures')) {
      this.activeRoute = 'factures';
    } else if (url.includes('/profil')) {
      this.activeRoute = 'profil';
    } else if (url.includes('/addvehicules')) {
      this.activeRoute = 'addvehicules';
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
  }
}
