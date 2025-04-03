import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Reparation, EtapeReparation, CommentaireEtape, ReparationStatus, EtapeStatus, PhotoReparation, User } from '../../../../models/reparation.model';
import { ReparationService } from '../../../../services/reparation.service';
import { FactureService } from '../../../../services/facture.service';
import { Facture } from '../../../../models/facture.model';
import { switchMap, catchError, tap, finalize } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { TokenService } from '../../../../services/token/token.service';
import { SupabaseService } from '../../../../services/supabase/supabase.service';
import { Location } from '@angular/common'; // Import Location for goBack

interface CurrentUserInfo {
  _id: string;
  role: string;
}

@Component({
  selector: 'app-manager-reparation-details',
  templateUrl: './manager-reparation-details.component.html',
  styleUrls: ['./manager-reparation-details.component.css']
})
export class ManagerReparationDetailsComponent implements OnInit {
  public ReparationStatus = ReparationStatus;
  public EtapeStatus = EtapeStatus;

  reparation: Reparation | null = null;
  loading: boolean = true;
  error: string | null = null;
  activeTab: string = 'etapes';
  
  // State for comments
  commentairesVisibles: { [etapeId: string]: boolean } = {};
  nouveauCommentaireText: { [etapeId: string]: string } = {};
  isAddingCommentaire: { [etapeId: string]: boolean } = {};

  // State for photos
  filteredPhotos: PhotoReparation[] = [];
  selectedEtapeFilter: string = '';
  showPhotoUploadModal: boolean = false;
  etapePourPhoto: EtapeReparation | null = null;
  showPhotoViewerModal: boolean = false;
  selectedPhotoUrl: string = '';
  showDeleteConfirmation: boolean = false;
  photoToDelete: PhotoReparation | null = null;

  currentUser: CurrentUserInfo | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reparationService: ReparationService,
    private factureService: FactureService, // Keep even if unused for now
    private tokenService: TokenService,
    private supabaseService: SupabaseService,
    private location: Location // Inject Location
  ) {}

  ngOnInit(): void {
    const userId = this.tokenService.getUserId();
    const userRole = this.tokenService.getUserRole();

    if (!userId || !userRole) {
      console.error("Impossible de récupérer l'ID ou le rôle de l'utilisateur depuis le token.");
      this.error = "Erreur d'authentification ou token invalide.";
      this.loading = false;
      return;
    }
    
    // Store current user info - needed for comment authoring, photo delete permissions etc.
    this.currentUser = { _id: userId, role: userRole };

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReparation(id);
    } else {
      this.error = 'ID de réparation non fourni';
      this.loading = false;
    }
  }

  loadReparation(id: string): void {
    this.loading = true;
    this.error = null;

    this.reparationService.getReparationById(id).subscribe({
      next: (reparation) => {
        this.reparation = reparation; 
        this.loading = false;
        this.initializeComponentState();
      },
      error: (err) => {
        this.error = err.userMessage || 'Erreur lors du chargement de la réparation';
        this.loading = false;
        console.error('Erreur:', err);
      }
    });
  }

  initializeComponentState(): void {
    if (this.reparation) {
      this.filteredPhotos = this.reparation.photos ? [...this.reparation.photos].sort((a, b) => new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime()) : [];
      this.commentairesVisibles = {};
      this.nouveauCommentaireText = {};
      this.isAddingCommentaire = {};
      if (this.reparation.etapesSuivi) {
        this.reparation.etapesSuivi.forEach(etape => {
          this.commentairesVisibles[etape._id] = false;
          this.nouveauCommentaireText[etape._id] = '';
          this.isAddingCommentaire[etape._id] = false;
          if (etape.commentaires) {
            etape.commentaires.forEach(comment => {
               comment.expanded = (comment.message?.length || 0) <= 100; // Default expanded if short
            });
          }
        });
      }
    }
  }

  // --- Global Status Update Methods ---
  
  updateStatus(newStatus: ReparationStatus, dateFinReelle?: Date): void {
    if (this.reparation && this.reparation.statusReparation !== newStatus) {
      const currentId = this.reparation._id; // Store id before potential nullification
      console.log(`Manager attempting to update status for ${currentId} to ${newStatus}`);
      this.loading = true;
      this.reparationService.updateReparationStatus(currentId, newStatus, dateFinReelle)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: updatedReparation => {
            console.log('Global status update successful:', updatedReparation);
            // Check if the current reparation ID still matches before updating
            if (this.reparation && this.reparation._id === currentId) {
                 this.reparation = updatedReparation;
                 this.initializeComponentState(); // Re-initialize state if needed
            } else {
                console.warn("Reparation changed during status update, not updating local state.");
            }
          },
          error: err => {
            console.error('Error updating reparation global status:', err);
            this.error = err.userMessage || `Erreur lors de la mise à jour du statut global`;
          }
        });
    } else {
        console.log("Status update skipped. Reparation null or status unchanged.");
    }
  }

  finishReparation(): void {
    if (this.reparation) {
        console.log(`Manager finishing reparation ${this.reparation._id}`);
        this.updateStatus(ReparationStatus.Terminee, new Date());
        // Note: Invoice generation is handled separately or triggered by backend/another process
    }
  }

  // --- Etape Status and Comment Methods ---

  updateEtapeStatus(etapeId: string, newStatusValue: string): void {
     // Managers might not change step status directly, but keep for now if needed
    const newStatus = newStatusValue as EtapeStatus;
    if (this.reparation) {
      const etape = this.reparation.etapesSuivi.find(e => e._id === etapeId);
      if (etape && etape.status !== newStatus) {
        const repId = this.reparation._id;
        this.loading = true; // Consider more granular loading indicator
        this.reparationService.updateStepStatus(repId, etapeId, newStatus)
          .pipe(
            finalize(() => this.loading = false)
          )
          .subscribe({
            next: updatedEtape => {
              if (this.reparation && this.reparation._id === repId) { // Check if reparation context is still valid
                const index = this.reparation!.etapesSuivi.findIndex(e => e._id === etapeId);
                if (index !== -1) {
                  this.reparation!.etapesSuivi[index] = updatedEtape;
                  console.log(`Manager updated Step ${etapeId} status successfully`);
                }
              }
            },
            error: err => {
              console.error(`Manager error updating step ${etapeId} status:`, err);
              this.error = `Erreur màj étape: ${err.userMessage || err}`;
            }
          });
      }
    }
  }
  
  // Allow manager to mark step as finished via checkbox click (if needed)
  finishStep(etape: EtapeReparation): void {
      if (this.reparation && etape.status !== EtapeStatus.Bloquee) {
         const newStatus = etape.status === EtapeStatus.Terminee ? EtapeStatus.EnCours : EtapeStatus.Terminee;
         this.updateEtapeStatus(etape._id, newStatus);
      }
  }

  addCommentaire(etapeId: string): void {
    const message = this.nouveauCommentaireText[etapeId]?.trim();
    if (this.reparation && etapeId && message && !this.isAddingCommentaire[etapeId]) {
      const repId = this.reparation._id;
      this.isAddingCommentaire[etapeId] = true;
      this.reparationService.addCommentToStep(repId, etapeId, message)
        .pipe(
          finalize(() => this.isAddingCommentaire[etapeId] = false)
        )
        .subscribe({
          next: updatedEtape => {
             if (this.reparation && this.reparation._id === repId) { // Check context
                const index = this.reparation!.etapesSuivi.findIndex(e => e._id === etapeId);
                if (index !== -1) {
                   // Replace the entire step with the updated one from backend (assume dates parsed)
                   this.reparation!.etapesSuivi[index] = updatedEtape;
                   // Ensure new comment has expanded state initialized (or handle in initialize)
                   this.reparation!.etapesSuivi[index].commentaires.forEach(c => {
                       if (c.expanded === undefined) { // Check if state not set
                           c.expanded = (c.message?.length || 0) <= 100;
                       }
                    });
                   this.nouveauCommentaireText[etapeId] = ''; // Clear input
                   this.commentairesVisibles[etapeId] = true; // Ensure comments are visible
                   console.log(`Manager added comment to step ${etapeId} successfully`);
                }
             }
          },
          error: err => {
            console.error(`Manager error adding comment to step ${etapeId}:`, err);
            this.error = err.userMessage || `Erreur lors de l'ajout du commentaire`;
          }
        });
    }
  }

  toggleCommentairesVisibilite(etapeId: string): void {
    this.commentairesVisibles[etapeId] = !this.commentairesVisibles[etapeId];
  }

  toggleCommentExpand(commentaire: CommentaireEtape): void {
    commentaire.expanded = !commentaire.expanded;
  }

  // --- Photo Handling Methods ---

  openPhotoUploadModal(etape: EtapeReparation | null): void {
    this.etapePourPhoto = etape;
    this.showPhotoUploadModal = true;
  }

  closePhotoUploadModal(): void {
    this.showPhotoUploadModal = false;
    this.etapePourPhoto = null;
  }

  onPhotoUploaded(newPhoto: PhotoReparation): void {
    if (this.reparation) {
      if (!this.reparation.photos) {
        this.reparation.photos = [];
      }
       const parsedPhoto = newPhoto;
      this.reparation.photos.push(parsedPhoto);
      // Re-filter and sort photos using dateAjout
      this.filterPhotosByEtape(this.selectedEtapeFilter);
      this.closePhotoUploadModal(); // Close modal on success
    }
  }

  filterPhotosByEtape(etapeId: string | ''): void {
    this.selectedEtapeFilter = etapeId;
    if (!this.reparation || !this.reparation.photos) {
      this.filteredPhotos = [];
      return;
    }
    if (!etapeId) {
      this.filteredPhotos = [...this.reparation.photos].sort((a, b) => new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime());
    } else {
      this.filteredPhotos = this.reparation.photos.filter(photo => photo.etapeAssociee === etapeId)
                                                .sort((a, b) => new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime());
    }
  }
  
  clearPhotoFilter(): void {
      this.filterPhotosByEtape('');
  }

  countPhotosForEtape(etapeId: string): number {
    return this.reparation?.photos?.filter(photo => photo.etapeAssociee === etapeId).length || 0;
  }
  
  getEtapeTitle(etapeId: string): string {
      const etape = this.reparation?.etapesSuivi?.find(e => e._id === etapeId);
      return etape ? etape.titre : 'Étape inconnue';
  }

  openPhotoModal(imageUrl: string): void {
    this.selectedPhotoUrl = imageUrl;
    this.showPhotoViewerModal = true;
  }

  closePhotoModal(): void {
    this.showPhotoViewerModal = false;
    this.selectedPhotoUrl = '';
  }

  confirmDeletePhoto(photo: PhotoReparation): void {
    this.photoToDelete = photo;
    this.showDeleteConfirmation = true;
  }

  cancelDeletePhoto(): void {
    this.photoToDelete = null;
    this.showDeleteConfirmation = false;
  }

  deletePhoto(): void {
    if (!this.photoToDelete || !this.reparation) {
      this.cancelDeletePhoto();
      return;
    }

    // Assuming backend will identify photo by URL for deletion
    const photoUrl = this.photoToDelete.url;
    const repId = this.reparation._id;
    
    this.loading = true; // Use main loading or a specific one
    this.showDeleteConfirmation = false; // Close modal immediately

    console.warn('Photo deletion backend endpoint and Supabase cleanup not yet implemented.');
    // TODO: Implement backend call and Supabase cleanup
    /*
    this.reparationService.deletePhotoFromReparation(repId, photoUrl) // Pass URL as identifier
      .pipe(
         // Attempt to delete from Supabase regardless of backend result for cleanup
         switchMap(() => this.supabaseService.deleteImage(photoUrl)),
         finalize(() => {
             this.loading = false;
             this.photoToDelete = null;
         })
      )
      .subscribe({
        next: () => {
          console.log(`Photo ${photoUrl} deleted successfully from backend and storage.`);
          if (this.reparation && this.reparation._id === repId) { // Check context
             // Filter out using URL as the reliable identifier
             this.reparation.photos = this.reparation.photos?.filter(p => p.url !== photoUrl);
             this.filterPhotosByEtape(this.selectedEtapeFilter); // Refresh filtered list
          }
        },
        error: (err: any) => { // Explicitly type err as any for now
          console.error(`Error deleting photo ${photoUrl}:`, err);
          // Use err.message if available, otherwise provide a generic error message
          this.error = err?.message || `Erreur lors de la suppression de la photo.`;
          // Even on error, try to remove from local state
           if (this.reparation && this.reparation._id === repId) {
                this.reparation.photos = this.reparation.photos?.filter(p => p.url !== photoUrl);
                this.filterPhotosByEtape(this.selectedEtapeFilter);
           }
        }
      });
    */
    // Remove photo from local state immediately (temporary until backend is done)
    if (this.reparation && this.reparation._id === repId) {
        this.reparation.photos = this.reparation.photos?.filter(p => p.url !== photoUrl);
        this.filterPhotosByEtape(this.selectedEtapeFilter);
    }
    this.loading = false;
    this.photoToDelete = null;
    
  }

  // --- Helper Methods ---

  goBack(): void {
    this.location.back(); // Use Location service to navigate back
  }

  calculateProgress(): number {
    if (!this.reparation || !this.reparation.etapesSuivi || this.reparation.etapesSuivi.length === 0) {
      return 0;
    }
    const completedSteps = this.reparation.etapesSuivi.filter(etape => etape.status === EtapeStatus.Terminee).length;
    return Math.round((completedSteps / this.reparation.etapesSuivi.length) * 100);
  }

  getStatusClass(status: ReparationStatus | EtapeStatus): string {
    // Combine status checks if needed, or keep separate if styling differs
     switch (status) {
        // Reparation Status
        case ReparationStatus.Planifiee: return 'status-pending'; // Added Planifiee
        case ReparationStatus.EnCours: return 'status-in-progress';
        case ReparationStatus.EnAttentePieces: return 'status-waiting'; // Added EnAttentePieces
        case ReparationStatus.Terminee: return 'status-completed';
        case ReparationStatus.Facturee: return 'status-invoiced'; // Added Facturee
        case ReparationStatus.Annulee: return 'status-cancelled';
        // case ReparationStatus.Bloquee: return 'status-blocked'; // Reparation doesn't have Bloquee status in enum
        // Etape Status (can overlap or be distinct)
        case EtapeStatus.EnAttente: return 'status-pending'; // Or 'etape-pending' if different style
        case EtapeStatus.EnCours: return 'status-in-progress'; // Or 'etape-in-progress'
        case EtapeStatus.Terminee: return 'status-completed'; // Or 'etape-completed'
        case EtapeStatus.Bloquee: return 'status-blocked'; // Or 'etape-blocked'
        default: return 'status-unknown';
      }
  }

  getStatusLabel(status: ReparationStatus | EtapeStatus): string {
    // Use the shared enums
    return status; // The enum value itself is the label
  }
  
  // Get a display label for comment/photo author
  getAuteurLabel(auteur: User | { _id: string; prenom?: string; nom?: string; role?: string }): string {
      if (!auteur) return 'Inconnu';
      if (this.currentUser && auteur._id === this.currentUser._id) return 'Vous';
      if (auteur.prenom && auteur.nom) return `${auteur.prenom} ${auteur.nom}`;
      if (auteur.nom) return auteur.nom;
      if (auteur.role) return `Utilisateur (${auteur.role})`;
      return `Utilisateur (${auteur._id ? auteur._id.substring(0, 6) : '...'}...)`; // Safe access to _id
  }
}
