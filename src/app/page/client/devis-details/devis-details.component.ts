import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DevisService } from '../../../services/devis/devis.service';
import { Devis, PackChoisi } from '../../../models/devis.model';

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
export class ClientDevisDetailsComponent implements OnInit {
  devis: Devis | null = null;
  loading: boolean = false;
  error: string | null = null;
  // Propriétés pour le chat
  isChatVisible = false;
  mockMessages: Message[] = [
    { contenu: 'Bonjour, j\'ai un problème avec mes freins qui font un bruit étrange.', date: new Date('2024-03-20T10:30:00'), type: 'client' },
    { contenu: 'Bonjour, je vais examiner votre véhicule et vous faire un devis détaillé.', date: new Date('2024-03-20T10:35:00'), type: 'manager' },
    { contenu: 'D\'accord, merci. Pouvez-vous me dire approximativement combien de temps ça va prendre ?', date: new Date('2024-03-20T10:40:00'), type: 'client' }
  ];
  messageText: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devisService: DevisService
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID du devis depuis l'URL
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDevisDetails(id);
    } else {
      this.error = "ID du devis manquant";
    }
  }

  // Charger les détails du devis
  loadDevisDetails(id: string): void {
    this.loading = true;
    this.error = null;

    this.devisService.getClientDevisById(id).subscribe({
      next: (response) => {
        if (response && response.success) {
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
    
    this.devisService.updateDevis(this.devis._id, { status: 'accepte' }).subscribe({
      next: (response) => {
        console.log(response);
        
        if (response && response.success) {
          if (this.devis) {
            this.devis.status = 'accepte';
          }
        } else {
          this.error = 'Erreur lors de l\'acceptation du devis';
        }
      },
      error: (err) => {
        console.error('Erreur lors de l\'acceptation du devis', err);
        this.error = 'Erreur lors de l\'acceptation du devis';
      }
    });
  }
  
  // Refuser le devis
  refuserDevis(): void {
    if (!this.devis || !this.devis._id) return;
    
    this.devisService.updateDevis(this.devis._id, { status: 'refuse' }).subscribe({
      next: (response) => {
        if (response && response.success) {
          if (this.devis) {
            this.devis.status = 'refuse';
          }
        } else {
          this.error = 'Erreur lors du refus du devis';
        }
      },
      error: (err) => {
        console.error('Erreur lors du refus du devis', err);
        this.error = 'Erreur lors du refus du devis';
      }
    });
  }
  
  // Calculer le total des ser²vices choisis
  calculerTotalServicesChoisis(): number {
    if (!this.devis?.servicesChoisis?.length) return 0;
    
    return this.devis.servicesChoisis.reduce((total, service) => {
      return total + (service.service.prix || 0);
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

  // Méthode pour envoyer un nouveau message
  sendMessage(): void {
    if (!this.messageText.trim()) return;
    
    const newMessage: Message = {
      contenu: this.messageText.trim(),
      date: new Date(),
      type: 'client'
    };
    
    this.mockMessages.push(newMessage);
    this.messageText = '';
    
    // Faire défiler jusqu'au dernier message
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
}
