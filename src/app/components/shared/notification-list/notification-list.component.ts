import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { NotificationService } from '../../../services/notification/notification.service';
import { Notification } from '../../../models/notification.model';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush // Optimisation: Mettre à jour seulement si les entrées changent
})
export class NotificationListComponent implements OnInit, OnDestroy {
  notifications$: Observable<Notification[]>;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  
  currentPage: number = 1;
  totalPages: number = 1;

  private notificationSubscription: Subscription | undefined;
  private servicePaginationSubscription: Subscription | undefined; // Pour écouter la pagination du service

  @Output() closeRequest = new EventEmitter<void>();
  @Output() notificationClicked = new EventEmitter<void>();

  constructor(
    public notificationService: NotificationService,
    private cdRef: ChangeDetectorRef
  ) {
    this.notifications$ = this.notificationService.notifications$;
    this.isLoading$ = this.notificationService.isLoading$;
    this.error$ = this.notificationService.error$;
  }

  ngOnInit(): void {
    this.notificationService.fetchInitialNotifications();

    this.notificationSubscription = this.notifications$.subscribe(() => {
       this.currentPage = this.notificationService.getCurrentPage();
       this.totalPages = this.notificationService.getTotalPages();
       this.cdRef.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
  }

  onNotificationClick(notification: Notification): void {
    this.notificationService.navigateToLink(notification.link, notification);
    this.notificationClicked.emit();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  loadMore(): void {
      this.notificationService.loadMoreNotifications();
  }
  
  trackById(index: number, item: Notification): string {
      return item._id;
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'DEVIS_FINALIZED':
      case 'DEVIS_ACCEPTED':
      case 'DEVIS_REFUSED':
      case 'NEW_DEVIS_REQUEST':
        return 'fa-file-invoice-dollar'; // Icône facture/devis
      case 'NEW_CHAT_MESSAGE':
        return 'fa-comment-dots'; // Icône chat
      case 'REPARATION_ASSIGNED':
      case 'REPARATION_STATUS_UPDATE':
      case 'REPARATION_COMPLETED':
        return 'fa-tools'; // Icône outils/réparation
      case 'FACTURE_GENERATED':
         return 'fa-receipt'; // Icône reçu/facture
      default:
        return 'fa-bell'; // Icône par défaut
    }
  }
} 