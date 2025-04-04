import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from '../../../../services/notification/notification.service';

@Component({
  selector: 'app-mecanicien-layout',
  templateUrl: './mecanicien-layout.component.html',
  styleUrls: ['./mecanicien-layout.component.css']
})
export class MecanicienLayoutComponent implements OnInit, OnDestroy {
  // Largeur de la sidebar du mécanicien (en pixels)
  sidebarWidth: number = 250;
  
  // Largeur de la sidebar en mode responsive (en pixels)
  responsiveSidebarWidth: number = 60;
  
  constructor(private notificationService: NotificationService) {
    // Ajuster la largeur de la sidebar en fonction de la taille de l'écran
    this.adjustSidebarWidth();
    
    // Écouter les changements de taille de l'écran
    window.addEventListener('resize', this.adjustSidebarWidth.bind(this));
  }
  
  ngOnInit(): void {
    this.notificationService.connectSocket();
  }

  ngOnDestroy(): void {
    this.notificationService.disconnectSocket();
    window.removeEventListener('resize', this.adjustSidebarWidth.bind(this));
  }

  private adjustSidebarWidth(): void {
    if (window.innerWidth <= 768) {
      this.sidebarWidth = this.responsiveSidebarWidth;
    } else {
      this.sidebarWidth = 250;
    }
  }
}
