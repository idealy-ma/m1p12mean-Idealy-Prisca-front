import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DevisService } from '../../../services/devis/devis.service';
import { Devis, PackChoisi } from '../../../models/devis.model';
import { ChatService, ChatMessage } from '../../../services/chat/chat.service';
import { Subscription } from 'rxjs';

// Interface Message pour le chat
interface Message {
  contenu: string;
  date: Date;
  type: 'client' | 'manager';
}

@Component({
  selector: 'app-devis-details',
  templateUrl: './devis-details.component.html',
  styleUrls: ['./devis-details.component.css']
})
export class ClientDevisDetailsComponent implements OnInit, OnDestroy, AfterViewChecked {
  devis: Devis | null = null;
  loading: boolean = false;
  error: string | null = null;
  isAccepting: boolean = false;
  isRejecting: boolean = false;
  // Propriétés pour le chat
  isChatVisible = false;
  @ViewChild('chatMessagesContainer') private chatMessagesContainer: ElementRef | undefined;
  chatMessages: ChatMessage[] = [];
  newChatMessage: string = '';
  chatError: string | null = null;
  private chatSubscription: Subscription | undefined;
  private errorSubscription: Subscription | undefined;
  private devisId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devisService: DevisService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.devisId = this.route.snapshot.paramMap.get('id');
    if (this.devisId) {
      this.loadDevisDetails(this.devisId);
      this.setupChat(this.devisId); 
    } else {
      this.error = "ID du devis manquant";
      this.loading = false;
    }
  }

  // Charger les détails du devis
  loadDevisDetails(id: string): void {
    this.loading = true;
    this.error = null;

    this.devisService.getClientDevisById(id).subscribe({
      next: (response) => {
        if (response && response.success) {
          console.log('Devis récupéré:', response.data);
          this.devis = response.data;
        } else {
          this.error = 'Format de données invalide';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du devis', err);
        this.error = 'Erreur lors du chargement du devis';
        this.loading = false;
      }
    });
  }

  // Naviguer vers la liste des devis
  goBack(): void {
    this.router.navigate(['/client/devis']);
  }
  
  // Accepter le devis
  accepterDevis(): void {
    if (!this.devis || !this.devis._id) return;
    
    this.isAccepting = true;
    this.error = null;
    
    this.devisService.acceptDevis(this.devis._id).subscribe({
      next: (response) => {
        if (response && response.success) {
          if (this.devis) {
            this.devis.status = 'accepte';
          }
        } else {
          this.error = 'Erreur lors de l\'acceptation du devis';
        }
        this.isAccepting = false;
      },
      error: (err) => {
        console.error('Erreur lors de l\'acceptation du devis', err);
        this.error = 'Erreur lors de l\'acceptation du devis';
        this.isAccepting = false;
      }
    });
  }
  
  // Refuser le devis
  refuserDevis(): void {
    if (!this.devis || !this.devis._id) return;
    
    this.isRejecting = true;
    this.error = null;
    
    this.devisService.declineDevis(this.devis._id).subscribe({
      next: (response) => {
        if (response && response.success) {
          if (this.devis) {
            this.devis.status = 'refuse';
          }
        } else {
          this.error = 'Erreur lors du refus du devis';
        }
        this.isRejecting = false;
      },
      error: (err) => {
        console.error('Erreur lors du refus du devis', err);
        this.error = 'Erreur lors du refus du devis';
        this.isRejecting = false;
      }
    });
  }
  
  // Calculer le total des services choisis
  calculerTotalServicesChoisis(): number {
    if (!this.devis?.servicesChoisis?.length) return 0;
    
    // Utiliser ?. et ?? pour un accès sécurisé au prix
    return this.devis.servicesChoisis.reduce((total, serviceChoisi) => {
      const prix = serviceChoisi?.service?.prix ?? 0;
      return total + prix;
    }, 0);
  }
  
  // Calculer le total des packs choisis
  calculerTotalPacksChoisis(): number {
    if (!this.devis?.packsChoisis?.length) return 0;
    
    return this.devis.packsChoisis.reduce((total, pack) => {
      return total + this.getPrixPack(pack);
    }, 0);
  }
  
  // Obtenir le prix d'un pack avec remise
  getPrixPack(packChoisi: PackChoisi): number {
    if (!packChoisi || !packChoisi.servicePack) return 0;
    
    // Utiliser un prix de base fixe comme dans le composant manager
    // Le modèle ne contient pas de prix direct, donc on utilise une valeur par défaut
    const prixBase = 10000; // Prix de base fixe à 100 euros (en centimes)
    
    // Appliquer la remise si elle existe
    if (packChoisi.servicePack.remise) {
      return prixBase * (1 - packChoisi.servicePack.remise / 100);
    }
    
    return prixBase;
  }

  // Méthode pour afficher/masquer le chat
  toggleChat(): void {
    this.isChatVisible = !this.isChatVisible;
  }

  // Calculer le total des lignes supplémentaires
  calculerTotalLignesSupplementaires(): number {
    if (!this.devis?.lignesSupplementaires?.length) return 0;
    
    return this.devis.lignesSupplementaires.reduce((total, ligne) => {
      return total + ((ligne.prix || 0) * (ligne.quantite || 1));
    }, 0);
  }

  // Calculer le total de la main d'œuvre
  calculerTotalMainOeuvre(): number {
    if (!this.devis?.mecaniciensTravaillant?.length) return 0;
    
    return this.devis.mecaniciensTravaillant.reduce((total, mecanicien) => {
      const tarifHoraire = mecanicien.mecanicien?.tarifHoraire || mecanicien.tarifHoraire || 0;
      const heureDeTravail = mecanicien.heureDeTravail || 0;
      return total + (tarifHoraire * heureDeTravail);
    }, 0);
  }

  // Calculer le total général
  calculerTotalGeneral(): number {
    return this.calculerTotalServicesChoisis() + 
           this.calculerTotalPacksChoisis() + 
           this.calculerTotalLignesSupplementaires() + 
           this.calculerTotalMainOeuvre();
  }

  ngOnDestroy(): void {
    this.chatSubscription?.unsubscribe();
    this.errorSubscription?.unsubscribe();
    this.chatService.disconnect();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  // --- AJOUT DES MÉTHODES MANQUANTES DU CHAT ---
  setupChat(devisId: string): void {
    this.chatService.connect(devisId);

    // Charger l'historique
    this.chatService.loadInitialMessages(devisId).subscribe({
      next: (messages) => {
        this.chatMessages = messages;
        this.chatError = null;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error("Erreur chargement historique chat:", err);
        this.chatError = "Impossible de charger l'historique du chat.";
      }
    });

    // S'abonner aux nouveaux messages
    this.chatSubscription = this.chatService.getMessages().subscribe((message) => {
      this.chatMessages.push(message);
      this.scrollToBottom();
    });

    // S'abonner aux erreurs du chat
    this.errorSubscription = this.chatService.chatError$.subscribe(errorMsg => {
      this.chatError = errorMsg;
      console.error('Erreur ChatService:', errorMsg);
    });
  }

  // Nouvelle méthode pour envoyer les messages via le service
  sendChatMessage(): void {
    if (this.newChatMessage.trim() && this.devisId) {
      this.chatService.sendMessage(this.devisId, this.newChatMessage.trim());
      this.newChatMessage = '';
      this.chatError = null;
    } else if (!this.devisId) {
        this.chatError = "Impossible d'envoyer : ID du devis inconnu.";
    }
  }
  
  private scrollToBottom(): void {
    try {
        // Ajouter un délai pour s'assurer que le DOM est mis à jour
        setTimeout(() => {
          if (this.chatMessagesContainer) {
             this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
          }
        }, 0);
    } catch(err) { 
        console.error("Erreur lors du défilement du chat:", err);
    }                 
  }
  // --- FIN AJOUT DES MÉTHODES CHAT ---
}
