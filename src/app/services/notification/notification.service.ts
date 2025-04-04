import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { TokenService } from '../token/token.service';
import { Notification } from '../../models/notification.model';
import { ApiPaginatedResponse, ApiResponse } from '../../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private socket: Socket | undefined;
  private readonly socketBaseUrl = environment.apiUrl.replace('/api/v1', ''); // URL de base pour Socket.IO

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new Subject<string | null>();

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  private currentPage = 1;
  private limit = 15; // Nombre de notifs à charger par page
  private totalPages = 1;
  private totalNotifications = 0;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  connectSocket(): void {
    const token = this.tokenService.token;
    if (!token) {
      console.warn('NotificationService: Impossible de connecter le socket, token manquant.');
      return;
    }

    if (this.socket?.connected) {
      console.log('NotificationService: Socket déjà connecté.');
      return;
    }

    console.log(`NotificationService: Connexion au socket principal: ${this.socketBaseUrl}`);
    this.socket = io(this.socketBaseUrl, {
      auth: { token: token } // Passer le token pour l'authentification backend
    });

    this.socket.on('connect', () => {
      console.log('NotificationService: Connecté au socket principal:', this.socket?.id);
      // Demander le nombre initial de non lus après connexion
      this.socket?.emit('get_unread_count');
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('NotificationService: Déconnecté du socket principal:', reason);
      // Gérer la reconnexion ou informer l'utilisateur si nécessaire
      this.errorSubject.next('Déconnexion du service de notification.');
    });

    this.socket.on('connect_error', (err) => {
      console.error('NotificationService: Erreur de connexion Socket.IO:', err.message);
      this.errorSubject.next(`Erreur de connexion aux notifications: ${err.message}`);
      this.disconnectSocket(); // Nettoyer en cas d'échec
    });

    // Écouter les nouvelles notifications
    this.socket.on('new_notification', (notification: Notification) => {
      console.log('NotificationService: Nouvelle notification reçue:', notification);
      
      // Ajouter au début de la liste et mettre à jour le compteur
      const currentNotifications = this.notificationsSubject.getValue();
      // Éviter les duplications si la même notif arrive très vite
      if (!currentNotifications.some(n => n._id === notification._id)) {
        this.notificationsSubject.next([notification, ...currentNotifications]);
        // Mettre à jour le compte SEULEMENT si elle n'est pas déjà lue (évite incrément si reçu après markAsRead)
        if (!notification.isRead) {
            this.unreadCountSubject.next(this.unreadCountSubject.getValue() + 1);
        }
        this.totalNotifications++;
        
        // --- Afficher le Toast --- 
        const toast = this.toastr.info(notification.message, 'Nouvelle Notification', {
            tapToDismiss: false, // Empêche la fermeture au clic simple
            closeButton: true,   // Ajoute un bouton de fermeture
        });

        // Rendre le toast cliquable pour naviguer
        toast.onTap.subscribe(() => {
            console.log(`Toast cliqué, navigation vers: ${notification.link}`);
            this.navigateToLink(notification.link, notification);
            // Optionnel: fermer le toast après clic si souhaité
            this.toastr.clear(toast.toastId);
        });
        // --- Fin Afficher le Toast ---
      }
    });
    
    // Écouter la mise à jour du compteur (reçu après get_unread_count)
    this.socket.on('unread_count', (count: number) => {
        console.log('NotificationService: Compteur non lu reçu:', count);
        this.unreadCountSubject.next(count);
    });
    
    // Écouter les erreurs spécifiques aux notifications
     this.socket.on('notification_error', (error) => {
       console.error('NotificationService: Erreur de notification reçue du serveur:', error.message);
       this.errorSubject.next(`Erreur de notification: ${error.message}`);
     });
  }

  disconnectSocket(): void {
    if (this.socket) {
      console.log('NotificationService: Déconnexion manuelle du socket.');
      this.socket.disconnect();
      this.socket = undefined;
    }
    // Réinitialiser l'état
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalNotifications = 0;
    this.isLoadingSubject.next(false);
    this.errorSubject.next(null);
  }

  // Charge la première page de notifications
  fetchInitialNotifications(): void {
    this.currentPage = 1;
    this.notificationsSubject.next([]); // Vider la liste existante
    this.loadNotifications(this.currentPage);
  }

  // Charge la page suivante de notifications
  loadMoreNotifications(): void {
    if (this.isLoadingSubject.value || this.currentPage >= this.totalPages) {
      return; // Ne pas charger si déjà en cours ou si dernière page atteinte
    }
    this.currentPage++;
    this.loadNotifications(this.currentPage);
  }

  private loadNotifications(page: number): void {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', this.limit.toString());

    const url = `${environment.apiUrl}/notifications`; // Utilise l'intercepteur pour le token

    this.http.get<ApiPaginatedResponse<Notification>>(url, { params })
      .pipe(
        tap(response => console.log("Réponse API notifications:", response)),
        map(response => {
           if (!response.success || !response.data || !response.pagination) {
             throw new Error(response.message || 'Erreur lors de la récupération des notifications');
           }
           return response; // Passer la réponse complète
        }),
        catchError(error => {
          console.error("Erreur lors du chargement des notifications:", error);
          this.errorSubject.next("Impossible de charger les notifications.");
          return throwError(() => new Error("Impossible de charger les notifications."));
        }),
        // finalize(() => this.isLoadingSubject.next(false)) // Ne fonctionne pas bien avec BehaviorSubject?
      )
      .subscribe({
        next: response => {
          const currentNotifications = this.notificationsSubject.getValue();
          // Ajouter les nouvelles notifications à la liste existante
          this.notificationsSubject.next([...currentNotifications, ...response.data]);
          // Mettre à jour les infos de pagination
          this.currentPage = response.pagination.page;
          this.totalPages = response.pagination.totalPages;
          this.totalNotifications = response.pagination.total;
          // Mettre à jour le compteur non lu (peut être différent de pagination.total)
          // On le reçoit via socket, mais on peut aussi le récupérer via une autre route API si besoin
          // this.getUnreadCount().subscribe(); // Optionnel: forcer la MàJ du compteur via API
          this.isLoadingSubject.next(false);
        },
        error: () => {
            this.isLoadingSubject.next(false); // S'assurer que isLoading est false en cas d'erreur
        }
      });
  }

  // Récupère le compte non lu via API (utilisé si besoin, ex: après markAllAsRead)
  getUnreadCount(): Observable<number> {
      const url = `${environment.apiUrl}/notifications/unread-count`;
      return this.http.get<ApiResponse<{ count: number }>>(url).pipe(
          map(response => {
              if (!response.success) {
                  throw new Error(response.message || 'Erreur comptage non lus');
              }
              const count = response.data?.count ?? 0;
              this.unreadCountSubject.next(count); // Mettre à jour le BehaviorSubject
              return count;
          }),
          catchError(error => {
              console.error("Erreur getUnreadCount:", error);
              this.errorSubject.next("Impossible de récupérer le nombre de notifications non lues.");
              return throwError(() => new Error("Impossible de récupérer le nombre de notifications non lues."));
          })
      );
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) return; // Déjà lue

    const url = `${environment.apiUrl}/notifications/${notification._id}/mark-read`;

    this.http.patch<ApiResponse<any>>(url, {})
      .pipe(
        catchError(error => {
          console.error(`Erreur lors du marquage de la notification ${notification._id} comme lue:`, error);
          this.errorSubject.next("Erreur lors de la mise à jour de la notification.");
          return throwError(() => new Error("Erreur lors de la mise à jour de la notification."));
        })
      )
      .subscribe(response => {
        if (response.success) {
          // Mettre à jour l'état local
          const currentNotifications = this.notificationsSubject.getValue();
          const updatedNotifications = currentNotifications.map(n => 
            n._id === notification._id ? { ...n, isRead: true } : n
          );
          this.notificationsSubject.next(updatedNotifications);
          // Décrémenter le compteur
          this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.getValue() - 1));
          console.log(`Notification ${notification._id} marquée comme lue.`);
        } else {
            this.errorSubject.next(response.message || "Erreur inconnue lors de la mise à jour.");
        }
      });
  }

  markAllAsRead(): void {
    const url = `${environment.apiUrl}/notifications/mark-all-read`;

    this.http.post<ApiResponse<{ message: string }>>(url, {})
      .pipe(
        catchError(error => {
          console.error("Erreur lors du marquage de toutes les notifications comme lues:", error);
          this.errorSubject.next("Erreur lors de la mise à jour des notifications.");
          return throwError(() => new Error("Erreur lors de la mise à jour des notifications."));
        })
      )
      .subscribe(response => {
        if (response.success) {
          // Mettre à jour l'état local
          const currentNotifications = this.notificationsSubject.getValue();
          const updatedNotifications = currentNotifications.map(n => 
             n.isRead ? n : { ...n, isRead: true }
          );
          this.notificationsSubject.next(updatedNotifications);
          // Mettre le compteur à 0
          this.unreadCountSubject.next(0);
          console.log("Toutes les notifications ont été marquées comme lues.");
        } else {
            this.errorSubject.next(response.message || "Erreur inconnue lors de la mise à jour.");
        }
      });
  }

  navigateToLink(link: string, notification?: Notification): void {
    if (notification && !notification.isRead) {
        this.markAsRead(notification);
    }
    this.router.navigateByUrl(link);
  }

  // --- AJOUT : Getters publics pour la pagination ---
  getCurrentPage(): number { 
    return this.currentPage;
  }

  getTotalPages(): number { 
    return this.totalPages;
  }
  // --- FIN AJOUT ---
} 