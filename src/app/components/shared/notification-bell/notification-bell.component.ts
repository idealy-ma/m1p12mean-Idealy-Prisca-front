import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationService } from '../../../services/notification/notification.service';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit {
  unreadCount$: Observable<number>;
  isListVisible: boolean = false;

  constructor(private notificationService: NotificationService) {
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit(): void {
    this.notificationService.fetchInitialNotifications();
  }

  toggleNotificationList(event: Event): void {
    event.stopPropagation();
    this.isListVisible = !this.isListVisible;
  }

  closeList(): void {
    this.isListVisible = false;
  }

  onNotificationClicked(): void {
     this.closeList();
  }
} 