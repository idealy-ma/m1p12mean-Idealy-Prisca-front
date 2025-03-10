import {
  Component,
  OnInit
} from '@angular/core';
import { Router } from '@angular/router';



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
   
  }

  constructor(
    
  ) {}
}
