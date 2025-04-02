import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReparationService } from '../../../../services/reparation.service';
import {
  Reparation,
  EtapeReparation,
  CommentaireEtape,
  PhotoReparation,
  ReparationStatus,
  EtapeStatus
} from '../../../../models/reparation.model';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-client-reparation-details',
  templateUrl: './client-reparation-details.component.html',
  styleUrls: ['./client-reparation-details.component.css']
})
export class ClientReparationDetailsComponent implements OnInit, OnDestroy {
  reparation: Reparation | null = null;
  loading: boolean = true;
  error: string | null = null;
  private reparationSubscription: Subscription | null = null;
  calculatedProgression: number = 0;

  activeTab: string = 'timeline';
  newComment: string = '';
  commentairesVisibles: { [etapeId: string]: boolean } = {};
  filteredPhotos: PhotoReparation[] = [];
  photoFilterEtapeId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reparationService: ReparationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReparation(id);
    } else {
      this.error = "ID de réparation manquant dans l'URL.";
      this.loading = false;
      console.error("ClientReparationDetailsComponent: ID manquant dans la route.");
    }
  }

  ngOnDestroy(): void {
    if (this.reparationSubscription) {
      this.reparationSubscription.unsubscribe();
    }
  }

  loadReparation(id: string): void {
    this.loading = true;
    this.error = null;
    this.calculatedProgression = 0;

    if (this.reparationSubscription) {
      this.reparationSubscription.unsubscribe();
    }

    this.reparationSubscription = this.reparationService.getReparationById(id)
      .pipe(
        finalize(() => { this.loading = false; })
      )
      .subscribe({
        next: (data: Reparation | undefined) => {
          if (data) {
            this.reparation = data;
            this.filteredPhotos = this.reparation.photos || [];
            this.calculateProgression();
            console.log('Réparation chargée:', this.reparation);
          } else {
            this.error = `Réparation avec ID ${id} non trouvée ou données invalides.`;
            console.error(this.error);
            this.reparation = null;
          }
        },
        error: (err: any) => {
          this.error = err.userMessage || 'Une erreur est survenue lors du chargement de la réparation.';
          console.error('ClientReparationDetailsComponent: Erreur chargement réparation:', err);
          this.reparation = null;
        }
      });
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-unknown';
    const lowerStatus = status.toLowerCase();

    switch (lowerStatus) {
      case ReparationStatus.EnCours.toLowerCase(): return 'status-in-progress';
      case ReparationStatus.Terminee.toLowerCase(): return 'status-completed';
      case ReparationStatus.EnAttentePieces.toLowerCase(): return 'status-pending';
      case ReparationStatus.Annulee.toLowerCase():
      case ReparationStatus.Facturee.toLowerCase(): return 'status-cancelled';

      case EtapeStatus.EnCours.toLowerCase(): return 'status-in-progress';
      case EtapeStatus.Terminee.toLowerCase(): return 'status-completed';
      case EtapeStatus.EnAttente.toLowerCase(): return 'status-pending';
      case EtapeStatus.Annulee.toLowerCase(): return 'status-cancelled';

      default: return 'status-unknown';
    }
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Inconnu';
    const lowerStatus = status.toLowerCase();
    const statusMapping: { [key: string]: string } = {
      [ReparationStatus.EnCours.toLowerCase()]: 'En cours',
      [ReparationStatus.Terminee.toLowerCase()]: 'Terminée',
      [ReparationStatus.EnAttentePieces.toLowerCase()]: 'En attente pièces',
      [ReparationStatus.Annulee.toLowerCase()]: 'Annulée',
      [ReparationStatus.Facturee.toLowerCase()]: 'Facturée',
      [EtapeStatus.EnCours.toLowerCase()]: 'En cours',
      [EtapeStatus.Terminee.toLowerCase()]: 'Terminée',
      [EtapeStatus.EnAttente.toLowerCase()]: 'En attente',
      [EtapeStatus.Annulee.toLowerCase()]: 'Annulée',
    };
    return statusMapping[lowerStatus] || status;
  }

  calculateProgression(): void {
    if (!this.reparation || !this.reparation.etapesSuivi || this.reparation.etapesSuivi.length === 0) {
      this.calculatedProgression = 0;
      return;
    }
    const totalEtapes = this.reparation.etapesSuivi.length;
    const etapesTerminees = this.reparation.etapesSuivi.filter((e: EtapeReparation) => e.status?.toLowerCase() === EtapeStatus.Terminee.toLowerCase()).length;
    this.calculatedProgression = totalEtapes > 0 ? Math.round((etapesTerminees / totalEtapes) * 100) : 0;
  }

  toggleCommentairesVisibilite(etapeId: string | undefined): void {
    if (!etapeId) return;
    this.commentairesVisibles[etapeId] = !this.commentairesVisibles[etapeId];
  }

  addComment(etapeId: string | undefined): void {
    if (!etapeId || !this.newComment.trim() || !this.reparation) return;

    console.warn(`ClientReparationDetailsComponent: addComment called for etape ${etapeId} - NO API CALL IMPLEMENTED YET in service.`);
    const etape = this.reparation.etapesSuivi.find((e: EtapeReparation) => e._id === etapeId);
      if (etape) {
      if(!etape.commentaires) etape.commentaires = [];
      const tempComment: CommentaireEtape = {
        message: this.newComment,
          date: new Date(),
        auteur: 'client',
      };
      etape.commentaires.push(tempComment);
        this.newComment = '';
      this.commentairesVisibles[etapeId] = true;
      alert("Ajout de commentaire simulé (non connecté à l'API)." + "\n Vérifier la console pour la structure de l'auteur.");
      console.log("Structure commentaire simulé:", tempComment);
    }
  }

  toggleCommentExpand(commentaire: CommentaireEtape): void {
    commentaire.expanded = !commentaire.expanded;
  }

  filterPhotosByEtape(etapeId: string): void {
    this.photoFilterEtapeId = etapeId;
    if (!this.reparation || !this.reparation.photos) {
      this.filteredPhotos = [];
      return;
    }
    if (!etapeId) {
      this.filteredPhotos = this.reparation.photos;
    } else {
      this.filteredPhotos = this.reparation.photos.filter((photo: PhotoReparation) => photo.etapeAssociee && photo.etapeAssociee === etapeId);
    }
  }

  countPhotosForEtape(etapeId: string | undefined): number {
    if (!etapeId || !this.reparation || !this.reparation.photos) return 0;
    return this.reparation.photos.filter((photo: PhotoReparation) => photo.etapeAssociee && photo.etapeAssociee === etapeId).length;
  }

  getEtapeNomById(etapeId: string | undefined): string {
    if (!etapeId || !this.reparation || !this.reparation.etapesSuivi) return 'Étape inconnue';
    const etape = this.reparation.etapesSuivi.find((e: EtapeReparation) => e._id === etapeId);
    return etape?.titre || 'Étape inconnue';
    }

  isClientComment(auteur: string | undefined): boolean {
    return auteur?.toLowerCase() === 'client';
  }
} 