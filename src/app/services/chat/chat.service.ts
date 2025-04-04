import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TokenService } from '../token/token.service';
import { ApiResponse } from '../../models/api-response.model';

// Interface pour les messages (peut être déplacée dans un fichier models/chat-message.model.ts)
export interface ChatMessage {
  _id?: string; // Ajouté si l'ID du message est renvoyé par le backend
  sender?: string; // ID de l'expéditeur
  senderName?: string; // Nom de l'expéditeur (inclus par le backend)
  senderRole?: 'client' | 'manager';
  message?: string;
  timestamp?: Date;
  isMe?: boolean; // Propriété côté client pour différencier les messages
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket | undefined;
  // Construire l'URL de base sans le namespace, il sera ajouté lors de la connexion
  private readonly socketBaseUrl = environment.apiUrl.replace('/api/v1', ''); // Ex: 'http://localhost:3000'
  private readonly namespace = '/devis-chat';

  // Subject pour gérer les erreurs de manière centralisée
  private chatErrorSubject = new Subject<string>();
  public chatError$ = this.chatErrorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  connect(devisId: string): void {
    if (this.socket?.connected) {
      console.log('Déjà connecté, rejoignant la room:', devisId);
      this.socket.emit('join_devis_room', devisId);
      return;
    }

    if (!this.socket) {
       const token = this.tokenService.token; // Utiliser TokenService
       console.log(`Connexion au socket: ${this.socketBaseUrl}${this.namespace}`);
       this.socket = io(`${this.socketBaseUrl}${this.namespace}`, {
         // auth: { token: token } // Optionnel si backend vérifie
       });

       this.socket.on('connect', () => {
         console.log('Connecté au serveur de chat:', this.socket?.id);
         this.socket?.emit('join_devis_room', devisId);
       });

       this.socket.on('disconnect', (reason) => {
         console.warn('Déconnecté du serveur de chat:', reason);
         this.chatErrorSubject.next('Déconnexion du chat.');
       });

       this.socket.on('connect_error', (err) => {
         console.error('Erreur de connexion Socket.IO:', err.message);
         this.chatErrorSubject.next(`Erreur de connexion au chat: ${err.message}`);
         this.disconnect();
       });

       this.socket.on('chat_error', (error) => {
         console.error('Erreur du chat reçue du serveur:', error.message);
         this.chatErrorSubject.next(`Erreur du chat: ${error.message}`);
       });
    }
  }

  disconnect(): void {
    if (this.socket) {
        console.log('Déconnexion manuelle du socket.');
        this.socket.disconnect();
        this.socket = undefined;
    }
  }

  sendMessage(devisId: string, message: string): void {
    // Récupérer les infos depuis TokenService
    const senderId = this.tokenService.getUserId();
    const senderRole = this.tokenService.getUserRole();
    // Récupérer nom et prénom via TokenService
    const userInfo = this.tokenService.getUserInfo();
    // Construire senderName (gérer le cas où ils seraient null)
    const senderName = (userInfo.prenom || userInfo.nom) 
                       ? `${userInfo.prenom || ''} ${userInfo.nom || ''}`.trim() 
                       : "Utilisateur Inconnu"; // Fallback

    if (!senderId || !senderRole) {
       const errorMsg = "Impossible d'envoyer le message: ID utilisateur ou rôle manquant.";
       console.error(errorMsg);
       this.chatErrorSubject.next(errorMsg);
       return;
    }

    // Vérifier si le rôle est bien 'client' ou 'manager'
    if (senderRole !== 'client' && senderRole !== 'manager') {
       const errorMsg = `Impossible d'envoyer le message: Rôle utilisateur non supporté (${senderRole}).`;
       console.error(errorMsg);
       this.chatErrorSubject.next(errorMsg);
       return;
    }

    const messageData = {
      devisId: devisId,
      senderId: senderId,
      senderName: senderName, // Utiliser le nom récupéré
      senderRole: senderRole as ('client' | 'manager'),
      message: message
    };

    if (!this.socket?.connected) {
        const errorMsg = "Impossible d'envoyer le message: Non connecté au chat.";
        console.error(errorMsg);
        this.chatErrorSubject.next(errorMsg);
        return;
    }

    console.log('Envoi du message:', messageData);
    this.socket?.emit('send_message', messageData);
  }

  getMessages(): Observable<ChatMessage> {
    return new Observable<ChatMessage>(observer => {
      if (!this.socket) {
          console.warn("getMessages appelé alors que le socket n'est pas initialisé.");
          return;
      }
      const handleReceiveMessage = (msg: ChatMessage) => {
         console.log('Message reçu:', msg);
         // Déterminer si le message vient de l'utilisateur actuel
         const currentUserId = this.tokenService.getUserId();
         msg.isMe = !!currentUserId && msg.sender === currentUserId;
         observer.next(msg);
      };

      this.socket.on('receive_message', handleReceiveMessage);

      return () => {
        console.log("Désinscription de l'écoute des messages.");
        this.socket?.off('receive_message', handleReceiveMessage);
      };
    });
  }

  // Méthode pour charger l'historique via API REST
  loadInitialMessages(devisId: string): Observable<ChatMessage[]> {
     const userRole = this.tokenService.getUserRole();
     const currentUserId = this.tokenService.getUserId(); // Récupérer aussi l'ID pour marquer les messages

     if (!userRole || !currentUserId) {
         return throwError(() => new Error("Impossible de charger l'historique: utilisateur non connecté ou rôle/ID inconnu."));
     }

     // Vérifier le rôle avant de construire l'URL
     if (userRole !== 'client' && userRole !== 'manager') {
         return throwError(() => new Error(`Impossible de charger l'historique: Rôle non supporté (${userRole}).`));
     }

     const rolePath = userRole;
     const url = `${environment.apiUrl}/${rolePath}/devis/${devisId}/messages`;
     console.log("Chargement de l'historique depuis:", url);

     return this.http.get<ApiResponse<ChatMessage[]>>(url).pipe(
        map(response => {
            if (!response.success || !response.data) {
                 const errorMsg = response?.message || 'Erreur lors de la récupération de l\'historique';
                 console.error("Réponse invalide API historique:", response);
                 throw new Error(errorMsg);
            }
            return (response.data || []).map(msg => {
                // Marquer les messages de l'utilisateur actuel
                msg.isMe = msg.sender === currentUserId;
                return msg;
            });
        }),
        catchError(error => {
            const errMsg = error instanceof Error ? error.message : "Impossible de charger l'historique.";
            console.error("Erreur catchError loadInitialMessages:", error);
            this.chatErrorSubject.next(errMsg);
            return throwError(() => new Error(errMsg));
        })
     );
  }
} 