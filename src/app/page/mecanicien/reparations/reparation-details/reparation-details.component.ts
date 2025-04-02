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

interface CurrentUserInfo {
  _id: string;
  role: string;
}

@Component({
  selector: 'app-reparation-details',
  templateUrl: './reparation-details.component.html',
  styleUrls: ['./reparation-details.component.css']
})
export class ReparationDetailsComponent implements OnInit {
  public ReparationStatus = ReparationStatus;
  public EtapeStatus = EtapeStatus;

  reparation: Reparation | null = null;
  loading: boolean = true;
  error: string | null = null;
  activeTab: string = 'etapes';
  newComment: { [etapeId: string]: string } = {};
  newPhotoFile: File | null = null;
  photoPreview: string | ArrayBuffer | null = null;
  photoError: string | null = null;
  photoUploading: boolean = false;
  photoDescription: string = '';
  photoEtapeId: string = '';
  filteredPhotos: PhotoReparation[] = [];
  photoFilterEtapeId: string = '';
  commentairesVisibles: { [etapeId: string]: boolean } = {};
  commentExpandedState: { [commentId: string]: boolean } = {};
  currentUser: CurrentUserInfo | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reparationService: ReparationService,
    private factureService: FactureService,
    private tokenService: TokenService,
    private supabaseService: SupabaseService
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
        this.reparation = reparation || null;
        this.loading = false;
        this.initializeComponentState();
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de la réparation';
        this.loading = false;
        console.error('Erreur:', err);
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
              this.commentExpandedState[this.getCommentId(etape._id, comment)] = (comment.message?.length || 0) <= 100;
            });
          }
        });
      }
    }
  }

  updateStatus(newStatusValue: string): void {
    const newStatus = newStatusValue as ReparationStatus;
    if (this.reparation && this.reparation.statusReparation !== newStatus) {
      this.loading = true;
      this.reparationService.updateReparationStatus(this.reparation._id, newStatus)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: updatedReparation => {
            this.reparation = updatedReparation;
            this.initializeComponentState();
            console.log('Reparation status updated successfully');
          },
          error: err => {
            console.error('Error updating reparation status:', err);
            this.error = `Erreur lors de la mise à jour du statut: ${err.message || err}`;
          }
        });
    }
  }

  updateEtapeStatus(etapeId: string, newStatusValue: string): void {
    const newStatus = newStatusValue as EtapeStatus;
    if (this.reparation) {
      const etape = this.reparation.etapesSuivi.find(e => e._id === etapeId);
      if (etape && etape.status !== newStatus) {
        this.loading = true;
        this.reparationService.updateStepStatus(this.reparation._id, etapeId, newStatus)
          .pipe(
            finalize(() => this.loading = false)
          )
          .subscribe({
            next: updatedEtape => {
              const index = this.reparation!.etapesSuivi.findIndex(e => e._id === etapeId);
              if (index !== -1) {
                this.reparation!.etapesSuivi[index] = updatedEtape;
              }
              console.log(`Step ${etapeId} status updated successfully`);
            },
            error: err => {
              console.error(`Error updating step ${etapeId} status:`, err);
              this.error = `Erreur lors de la mise à jour de l'étape: ${err.message || err}`;
            }
          });
      }
    }
  }

  addComment(etapeId: string): void {
    const message = this.newComment[etapeId]?.trim();
    if (this.reparation && etapeId && message) {
      this.loading = true;
      this.reparationService.addCommentToStep(this.reparation._id, etapeId, message)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: updatedEtape => {
            const index = this.reparation!.etapesSuivi.findIndex(e => e._id === etapeId);
            if (index !== -1) {
              this.reparation!.etapesSuivi[index] = this.reparationService['parseDatesInEtape'](updatedEtape);
              this.reparation!.etapesSuivi[index].commentaires.forEach(c => {
                 const commentFullId = this.getCommentId(etapeId, c);
                 if (this.commentExpandedState[commentFullId] === undefined) {
                     this.commentExpandedState[commentFullId] = (c.message?.length || 0) <= 100;
                 }
              });
            }
            this.newComment[etapeId] = '';
            this.commentairesVisibles[etapeId] = true;
            console.log(`Comment added to step ${etapeId} successfully`);
          },
          error: err => {
            console.error(`Error adding comment to step ${etapeId}:`, err);
            this.error = err.userMessage || `Erreur lors de l'ajout du commentaire`;
          }
        });
    }
  }

  async uploadPhoto(): Promise<void> {
    const description = this.photoDescription?.trim();
    if (this.reparation && this.newPhotoFile && description) {
      this.photoUploading = true;
      this.photoError = null;
      let publicUrl = '';

      try {
        console.log('Uploading photo to Supabase...');
        const urls = await this.supabaseService.uploadMultipleImages([this.newPhotoFile]);
        if (urls && urls.length > 0) {
          publicUrl = urls[0];
          console.log('Supabase upload successful, URL:', publicUrl);
        } else {
          throw new Error('L\'upload Supabase n\'a retourné aucune URL.');
        }

        const photoData = {
          url: publicUrl,
          description: description,
          etapeAssociee: this.photoEtapeId || undefined
        };

        console.log('Sending photo metadata to backend...', photoData);
        this.reparationService.addPhotoToReparation(this.reparation._id, photoData)
          .pipe(
            finalize(() => this.photoUploading = false)
          )
          .subscribe({
            next: (nouvellePhoto: PhotoReparation) => {
              console.log('Backend update successful', nouvellePhoto);
              if (this.reparation) {
                  if (!this.reparation.photos) {
                      this.reparation.photos = [];
                  }
                  this.reparation.photos.push(this.reparationService['parseDatesInPhoto'](nouvellePhoto));
                  this.filteredPhotos = [...this.reparation.photos];
              }
              this.newPhotoFile = null;
              this.photoPreview = null;
              this.photoDescription = '';
              this.photoEtapeId = '';
            },
            error: err => {
              console.error('Error adding photo metadata to backend:', err);
              this.photoError = err.message || `Erreur lors de l'enregistrement de la photo`;
            }
          });

      } catch (uploadError: any) {
        console.error('Error during photo upload process:', uploadError);
        this.photoError = uploadError.message || "Erreur lors de l'upload de l'image.";
        this.photoUploading = false;
      }

    } else if (!this.newPhotoFile) {
        this.photoError = "Veuillez sélectionner un fichier image.";
    } else if (!description) {
      this.photoError = "La description de la photo est requise.";
    }
  }

  finishStep(etape: EtapeReparation): void {
    const nouveauStatut = (etape.status === EtapeStatus.Terminee) 
                          ? EtapeStatus.EnCours 
                          : EtapeStatus.Terminee; 
    this.updateEtapeStatus(etape._id, nouveauStatut);
  }

  calculateProgress(): number {
    if (!this.reparation || !this.reparation.etapesSuivi || this.reparation.etapesSuivi.length === 0) {
      return 0;
    }
    const completedSteps = this.reparation.etapesSuivi.filter(e => e.status === EtapeStatus.Terminee).length;
    return Math.round((completedSteps / this.reparation.etapesSuivi.length) * 100);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case EtapeStatus.EnAttente:
        return 'status-waiting';
      case EtapeStatus.EnCours:
        return 'status-in-progress';
      case EtapeStatus.Bloquee:
        return 'status-blocked';
      case EtapeStatus.Terminee:
        return 'status-completed';
      default:
        return 'status-unknown';
    }
  }

  getStatusLabel(status: string): string {
    return status;
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  handleFileChange(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.newPhotoFile = fileList[0];
      this.photoError = null;
      const reader = new FileReader();
      reader.onload = (e) => this.photoPreview = reader.result;
      reader.onerror = (e) => this.photoError = "Erreur lors de la lecture du fichier.";
      reader.readAsDataURL(this.newPhotoFile);
    } else {
      this.newPhotoFile = null;
      this.photoPreview = null;
    }
  }

  toggleCommentairesVisibilite(etapeId: string): void {
    this.commentairesVisibles[etapeId] = !this.commentairesVisibles[etapeId];
  }

  toggleCommentExpand(etapeId: string, commentaire: CommentaireEtape): void {
    const commentFullId = this.getCommentId(etapeId, commentaire);
    this.commentExpandedState[commentFullId] = !this.commentExpandedState[commentFullId];
  }

  getCommentId(etapeId: string, commentaire: CommentaireEtape): string {
    const index = this.reparation?.etapesSuivi?.find(e => e._id === etapeId)?.commentaires?.indexOf(commentaire);
    return `${etapeId}-${index ?? commentaire.date.toISOString()}`;
  }

  getEtapeProgressThreshold(index: number): number {
    if (!this.reparation || !this.reparation.etapesSuivi || this.reparation.etapesSuivi.length === 0) {
      return 0;
    }
    return (index / this.reparation.etapesSuivi.length) * 100;
  }

  filterPhotosByEtape(etapeId: string): void {
    this.photoFilterEtapeId = etapeId;
    if (!this.reparation || !this.reparation.photos) {
      this.filteredPhotos = [];
      return;
    }
    if (etapeId === '') {
      this.filteredPhotos = [...this.reparation.photos];
    } else {
      this.filteredPhotos = this.reparation.photos.filter(photo => photo.etapeAssociee === etapeId);
    }
  }

  countPhotosForEtape(etapeId: string): number {
    if (!this.reparation || !this.reparation.photos) return 0;
    return this.reparation.photos.filter(photo => photo.etapeAssociee === etapeId).length;
  }

  getEtapeNomById(etapeId: string): string {
    if (!this.reparation || !this.reparation.etapesSuivi) return 'Étape inconnue';
    const etape = this.reparation.etapesSuivi.find(e => e._id === etapeId);
    return etape ? etape.titre : 'Étape inconnue';
  }

  finishReparation(): void {
    if (this.reparation && this.reparation.statusReparation !== ReparationStatus.Terminee) {
      this.loading = true;
      this.reparationService.updateReparationStatus(this.reparation._id, ReparationStatus.Terminee)
        .pipe(
          switchMap(updatedReparation => {
            this.reparation = updatedReparation;
            console.log('Reparation marked as completed. Attempting to generate invoice...');
            return this.factureService.generateFromReparation(this.reparation!._id).pipe(
              catchError(invoiceError => {
                console.error('Error generating invoice:', invoiceError);
                this.error = `Réparation terminée, mais erreur lors de la génération de la facture brouillon: ${invoiceError.message || invoiceError}`;
                return of(null);
              })
            );
          }),
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: (facture: Facture | null) => {
            if (facture) {
              console.log('Draft invoice generated successfully:', facture);
            } else {
              console.log('Invoice generation failed, but reparation status was updated.');
            }
            this.initializeComponentState();
          },
          error: err => {
            console.error('Error finishing reparation:', err);
            this.error = `Erreur lors de la finalisation de la réparation: ${err.message || err}`;
          }
        });
    }
  }

  private get reparationServiceWithParsers(): ReparationService & { parseDatesInEtape(etape: any): EtapeReparation, parseDatesInPhoto(photo: any): PhotoReparation } {
      return this.reparationService as any;
  }

  getAuteurLabel(auteur: User | undefined): string {
    if (!auteur) return 'Inconnu';
    if (this.currentUser && auteur._id === this.currentUser._id) {
      return 'Vous';
    }
    if (auteur.prenom && auteur.nom) {
      return `${auteur.prenom} ${auteur.nom}`;
    }
    return 'Auteur inconnu';
  }

  canComment(reparation: Reparation | null): boolean {
    if (!reparation || !this.currentUser) {
      return false;
    }
    const userRole = this.currentUser.role;
    const userId = this.currentUser._id;
    
    if (!userRole || !userId) return false;

    if (userRole === 'client' && reparation.client?._id === userId) {
      return true;
    }
    if (userRole === 'mecanicien' && reparation.mecaniciensAssignes?.some(a => a.mecanicien?._id === userId)) {
      return true;
    }
    return false;
  }
} 