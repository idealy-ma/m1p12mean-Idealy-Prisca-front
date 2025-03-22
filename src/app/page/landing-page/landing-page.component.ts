import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../services/authentification/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {

  constructor(
    private titleService: Title,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('AutoService - Le meilleur service auto à Madagascar');
    
    // Scroll to top when landing page is loaded
    window.scrollTo(0, 0);
    
    // Redirect to client dashboard if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/client']);
    }
  }

  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
  
  navigateToClientDashboard(): void {
    this.router.navigate(['/client']);
  }
}
