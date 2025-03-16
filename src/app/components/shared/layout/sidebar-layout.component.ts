import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sidebar-layout',
  templateUrl: './sidebar-layout.component.html',
  styleUrls: ['./sidebar-layout.component.css']
})
export class SidebarLayoutComponent {
  @Input() sidebarWidth: number = 250; // Largeur par défaut de la sidebar en pixels
  
  // Ce composant sert de conteneur générique pour une mise en page avec sidebar
} 