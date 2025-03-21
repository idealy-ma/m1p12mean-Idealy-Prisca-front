import { Component } from '@angular/core';

@Component({
  selector: 'app-client-layout',
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.css']
})
export class ClientLayoutComponent {
  // Largeur de la sidebar du client (en pixels)
  sidebarWidth: number = 250;
  
  // Largeur de la sidebar en mode responsive (en pixels)
  responsiveSidebarWidth: number = 60;
  
  constructor() {
    // Ajuster la largeur de la sidebar en fonction de la taille de l'écran
    this.adjustSidebarWidth();
    
    // Écouter les changements de taille de l'écran
    window.addEventListener('resize', () => {
      this.adjustSidebarWidth();
    });
  }
  
  private adjustSidebarWidth(): void {
    if (window.innerWidth <= 768) {
      this.sidebarWidth = this.responsiveSidebarWidth;
    } else {
      this.sidebarWidth = 250;
    }
  }
}
