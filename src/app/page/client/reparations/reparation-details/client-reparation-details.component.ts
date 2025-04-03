import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReparationService } from '../../../../services/reparation.service';
import {
  Reparation,
  EtapeReparation,
  CommentaireEtape,
  PhotoReparation,
  ReparationStatus,
  EtapeStatus,
  User
} from '../../../../models/reparation.model';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TokenService } from '../../../../services/token/token.service';

interface CurrentUserInfo {
  _id: string;
  role: string;
}

@Component({
  selector: 'app-client-reparation-details',
  templateUrl: './client-reparation-details.component.html',
  styleUrls: ['./client-reparation-details.component.css']
})
export class ClientReparationDetailsComponent implements OnInit, OnDestroy {
  public EtapeStatus = EtapeStatus;
  public ReparationStatus = ReparationStatus;

  reparation: Reparation | null = null;
  loading: boolean = true;
  error: string | null = null;
  private reparationSubscription: Subscription | null = null;
  calculatedProgression: number = 0;
  currentUser: CurrentUserInfo | null = null;

  activeTab: string = 'timeline';
  newComment: { [etapeId: string]: string } = {};
  commentairesVisibles: { [etapeId: string]: boolean } = {};
  filteredPhotos: PhotoReparation[] = [];
  photoFilterEtapeId: string = '';
  commentExpandedState: { [commentId: string]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reparationService: ReparationService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    const userId = this.tokenService.getUserId();
    const userRole = this.tokenService.getUserRole();
    if (!userId || !userRole) {
      console.error("ClientReparationDetailsComponent: Impossible de récupérer l'ID ou le rôle.");
      this.error = "Erreur d'authentification.";
      this.loading = false;
      return;
    }
    this.currentUser = { _id: userId, role: userRole };

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReparation(id);
    } else {
      this.error = "ID de réparation manquant dans l'URL.";
      this.loading = false;
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
            this.initializeComponentState();
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

  initializeComponentState(): void {
    if (this.reparation) {
      this.filteredPhotos = this.reparation.photos ? [...this.reparation.photos] : [];
      this.commentairesVisibles = {};
      this.commentExpandedState = {};
      this.newComment = {};
      if (this.reparation.etapesSuivi) {
        this.reparation.etapesSuivi.forEach(etape => {
          this.commentairesVisibles[etape._id] = false;
          this.newComment[etape._id] = '';
          if (etape.commentaires) {
            etape.commentaires.forEach(comment => {
              const commentFullId = this.getCommentId(etape._id, comment);
              this.commentExpandedState[commentFullId] = (comment.message?.length || 0) <= 150;
            });
          }
        });
      }
      this.calculateProgression();
    }
  }

  getCommentId(etapeId: string, commentaire: CommentaireEtape): string {
    const index = this.reparation?.etapesSuivi?.find(e => e._id === etapeId)?.commentaires?.indexOf(commentaire);
    return `${etapeId}-${index ?? commentaire.date.toISOString()}`;
  }

  toggleCommentExpand(commentaire: CommentaireEtape): void {
    let etapeIdParent: string | undefined;
    this.reparation?.etapesSuivi.forEach(etape => {
      if(etape.commentaires.includes(commentaire)){
        etapeIdParent = etape._id;
      }
    });
    if(etapeIdParent){
      const commentFullId = this.getCommentId(etapeIdParent, commentaire);
      this.commentExpandedState[commentFullId] = !this.commentExpandedState[commentFullId];
    } else {
      console.warn("Impossible de trouver l'étape parente pour toggleCommentExpand");
    }
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-unknown';
    switch (status) {
      case ReparationStatus.EnCours: return 'status-in-progress';
      case ReparationStatus.Terminee: return 'status-completed';
      case ReparationStatus.EnAttentePieces: return 'status-pending';
      case ReparationStatus.Annulee: return 'status-cancelled';
      case ReparationStatus.Facturee: return 'status-billed';
      case ReparationStatus.Planifiee: return 'status-planned';

      case EtapeStatus.EnCours: return 'status-in-progress';
      case EtapeStatus.Terminee: return 'status-completed';
      case EtapeStatus.EnAttente: return 'status-pending';
      case EtapeStatus.Bloquee: return 'status-blocked';

      default: return 'status-unknown';
    }
  }

  getStatusLabel(status: string | undefined): string {
    return status || 'Inconnu';
  }

  calculateProgression(): void {
    if (!this.reparation || !this.reparation.etapesSuivi || this.reparation.etapesSuivi.length === 0) {
      this.calculatedProgression = 0;
      return;
    }
    const totalEtapes = this.reparation.etapesSuivi.length;
    const etapesTerminees = this.reparation.etapesSuivi.filter((e: EtapeReparation) => e.status === EtapeStatus.Terminee).length;
    this.calculatedProgression = totalEtapes > 0 ? Math.round((etapesTerminees / totalEtapes) * 100) : 0;
  }

  toggleCommentairesVisibilite(etapeId: string | undefined): void {
    if (!etapeId) return;
    this.commentairesVisibles[etapeId] = !this.commentairesVisibles[etapeId];
  }

  addComment(etapeId: string | undefined): void {
    if (!etapeId || !this.newComment[etapeId]?.trim() || !this.reparation) return;
    const message = this.newComment[etapeId].trim();

    this.reparationService.addCommentToStep(this.reparation._id, etapeId, message)
      .subscribe({
        next: updatedEtape => {
          const index = this.reparation!.etapesSuivi.findIndex(e => e._id === etapeId);
          if (index !== -1) {
            this.reparation!.etapesSuivi[index] = updatedEtape; 
            const newCommentFromServer = updatedEtape.commentaires?.[updatedEtape.commentaires.length - 1];
            if (newCommentFromServer) {
               const commentFullId = this.getCommentId(etapeId, newCommentFromServer);
               this.commentExpandedState[commentFullId] = (newCommentFromServer.message?.length || 0) <= 150;
            }
          }
          this.newComment[etapeId] = '';
          this.commentairesVisibles[etapeId] = true;
          console.log(`Comment added to step ${etapeId} successfully by client`);
        },
        error: err => {
          console.error(`Client: Error adding comment to step ${etapeId}:`, err);
          this.error = err.message || `Erreur lors de l'ajout du commentaire`;
        }
      });
  }

  getAuteurLabel(auteur: User | undefined): string {
    if (!auteur) return 'Inconnu';
    if (this.currentUser && auteur._id === this.currentUser._id) {
      return 'Vous';
    }
    if (auteur.prenom && auteur.nom) {
      return `${auteur.prenom} ${auteur.nom}`;
    }
    return 'Garage';
  }

  canComment(reparation: Reparation | null): boolean {
    return !!this.currentUser && !!reparation && reparation.client?._id === this.currentUser._id;
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
} 