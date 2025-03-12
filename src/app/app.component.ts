import {
  Component,
  OnInit
} from '@angular/core';
import { AuthService } from './services/authentification/auth.service';
import { TokenService } from './services/token/token.service';



interface sideNavToggle{
  screenWidth:number;
  collapsed:boolean;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  
})
export class AppComponent implements OnInit {
  title = 'PARRC';
  isSuperAdmin:boolean = false;
  isSideNavCollapsed = false;
  screenWidth = 0;

  onToggleSideNav(data: sideNavToggle){
    this.screenWidth = data.screenWidth;
    this.isSideNavCollapsed = data.collapsed;

  }

  

  ngOnInit(): void {
    // Vérifier si un token existe et s'il est valide
    if (this.authService.isLoggedIn()) {
      if (!this.tokenService.isTokenValid()) {
        // Si le token est invalide, le supprimer
        this.tokenService.token = '';
      }
    }
  }

  constructor(
    private authService: AuthService,
    private tokenService: TokenService
  ) {}
}
