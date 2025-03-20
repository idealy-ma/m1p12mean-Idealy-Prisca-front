import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/authentification/auth.service';

@Component({
  selector: 'app-manager-sidebar',
  templateUrl: './manager-sidebar.component.html',
  styleUrls: ['./manager-sidebar.component.css']
})
export class ManagerSidebarComponent implements OnInit {
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
    if (url === '/manager') {
      this.activeRoute = 'dashboard';
    } else if (url.includes('/manager/devis')) {
      this.activeRoute = 'devis';
    } else if (url.includes('/manager/reparations')) {
      this.activeRoute = 'reparations';
    } else if (url.includes('/manager/factures')) {
      this.activeRoute = 'factures';
    } else if (url.includes('/manager/statistiques')) {
      this.activeRoute = 'statistiques';
    } else if (url.includes('/manager/service')) {
      this.activeRoute = 'service';
    } else if (url.includes('/manager/employees')) {
      this.activeRoute = 'employees';
    } else if (url.includes('/manager/employee')) {
      this.activeRoute = 'employee';
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
  }
} 