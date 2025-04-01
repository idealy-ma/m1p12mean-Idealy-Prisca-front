import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Reparation, EtapeReparation, CommentaireEtape, ReparationStatus, EtapeStatus, PhotoReparation } from '../../../../models/reparation.model';
import { ReparationService } from '../../../../services/reparation.service';
import { FactureService } from '../../../../services/facture.service';
import { Facture } from '../../../../models/facture.model';
import { switchMap, catchError, tap, finalize } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reparationService: ReparationService,
    private factureService: FactureService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(() => {
        this.loading = true;
        this.error = null;
        this.reparation = null;
      }),
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          return this.reparationService.getReparationById(id).pipe(
            catchError(err => {
              console.error('Error loading reparation:', err);
              this.error = `Erreur lors du chargement de la réparation: ${err.message || err}`;
              return of(undefined);
            })
          );
        } else {
          this.error = "ID de réparation manquant dans l'URL.";
          return of(undefined);
        }
      }),
      finalize(() => this.loading = false)
    ).subscribe(reparation => {
      if (reparation) {
        this.reparation = reparation;
        this.initializeComponentState();
      } else if (!this.error) {
        this.error = "Réparation non trouvée.";
      }
    });
  }

  initializeComponentState(): void {
    if (this.reparation) {
      this.filteredPhotos = this.reparation.photos ? [...this.reparation.photos] : [];
      this.commentairesVisibles = {};
      this.commentExpandedState = {};
      if (this.reparation.etapes) {
        this.reparation.etapes.forEach(etape => {
          this.commentairesVisibles[etape._id] = false;
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
    if (this.reparation && this.reparation.status !== newStatus) {
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
      const etape = this.reparation.etapes.find(e => e._id === etapeId);
      if (etape && etape.status !== newStatus) {
        this.loading = true;
        this.reparationService.updateStepStatus(this.reparation._id, etapeId, newStatus)
          .pipe(
            finalize(() => this.loading = false)
          )
          .subscribe({
            next: updatedEtape => {
              const index = this.reparation!.etapes.findIndex(e => e._id === etapeId);
              if (index !== -1) {
                this.reparation!.etapes[index] = updatedEtape;
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
      this.reparationService.addCommentToStep(this.reparation._id, etapeId, 'Mécanicien', message)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: updatedEtape => {
            const index = this.reparation!.etapes.findIndex(e => e._id === etapeId);
            if (index !== -1) {
              this.reparation!.etapes[index] = updatedEtape;
              const newComment = updatedEtape.commentaires[updatedEtape.commentaires.length - 1];
              this.commentExpandedState[this.getCommentId(etapeId, newComment)] = true;
            }
            this.newComment[etapeId] = '';
            console.log(`Comment added to step ${etapeId} successfully`);
          },
          error: err => {
            console.error(`Error adding comment to step ${etapeId}:`, err);
            this.error = `Erreur lors de l'ajout du commentaire: ${err.message || err}`;
          }
        });
    }
  }

  uploadPhoto(): void {
    const description = this.photoDescription?.trim();
    const mockPhotoUrl = 'assets/mock/photos/newly-uploaded.jpg';

    if (this.reparation && description) {
      this.photoUploading = true;
      this.photoError = null;
      this.reparationService.addPhotoToReparation(this.reparation._id, mockPhotoUrl, description, this.photoEtapeId || undefined)
        .pipe(
          finalize(() => this.photoUploading = false)
        )
        .subscribe({
          next: updatedReparation => {
            this.reparation = updatedReparation;
            this.filteredPhotos = this.reparation.photos ? [...this.reparation.photos] : [];
            this.newPhotoFile = null;
            this.photoPreview = null;
            this.photoDescription = '';
            this.photoEtapeId = '';
            console.log('Photo added successfully (mock URL)');
          },
          error: err => {
            console.error('Error adding photo:', err);
            this.photoError = `Erreur lors de l'ajout de la photo: ${err.message || err}`;
          }
        });
    } else if (!description) {
      this.photoError = "La description de la photo est requise.";
    }
  }

  calculateProgress(): number {
    if (!this.reparation || !this.reparation.etapes || this.reparation.etapes.length === 0) {
      return 0;
    }
    const completedSteps = this.reparation.etapes.filter(e => e.status === EtapeStatus.Terminee).length;
    return Math.round((completedSteps / this.reparation.etapes.length) * 100);
  }

  getStatusClass(status: ReparationStatus | EtapeStatus | string): string {
    switch (status) {
      case ReparationStatus.EnAttenteValidation: return 'status-pending';
      case ReparationStatus.Validee: return 'status-validated';
      case ReparationStatus.EnCours: return 'status-progress';
      case ReparationStatus.EnPause: return 'status-paused';
      case ReparationStatus.Terminee: return 'status-completed';
      case ReparationStatus.Annulee: return 'status-cancelled';
      case ReparationStatus.Refusee: return 'status-refused';
      case EtapeStatus.EnAttente: return 'status-pending';
      case EtapeStatus.EnCours: return 'status-progress';
      case EtapeStatus.Terminee: return 'status-completed';
      case EtapeStatus.Annulee: return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  getStatusLabel(status: ReparationStatus | EtapeStatus | string): string {
    switch (status) {
      case ReparationStatus.EnAttenteValidation: return 'En attente validation';
      case ReparationStatus.Validee: return 'Validée';
      case ReparationStatus.EnCours: return 'En cours';
      case ReparationStatus.EnPause: return 'En pause';
      case ReparationStatus.Terminee: return 'Terminée';
      case ReparationStatus.Annulee: return 'Annulée';
      case ReparationStatus.Refusee: return 'Refusée';
      case EtapeStatus.EnAttente: return 'À faire';
      case EtapeStatus.EnCours: return 'En cours';
      case EtapeStatus.Terminee: return 'Terminée';
      case EtapeStatus.Annulee: return 'Annulée';
      default: return 'Inconnu';
    }
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
    const commentIdentifier = commentaire.date.getTime().toString();
    return `${etapeId}-${commentIdentifier}`;
  }

  getEtapeProgressThreshold(index: number): number {
    if (!this.reparation || !this.reparation.etapes || this.reparation.etapes.length === 0) {
      return 0;
    }
    return (index / this.reparation.etapes.length) * 100;
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
    if (!this.reparation || !this.reparation.etapes) return 'Étape inconnue';
    const etape = this.reparation.etapes.find(e => e._id === etapeId);
    return etape ? etape.titre : 'Étape inconnue';
  }

  finishStep(etape: EtapeReparation): void {
    if (this.reparation && etape.status !== EtapeStatus.Terminee) {
      this.updateEtapeStatus(etape._id, EtapeStatus.Terminee);
    }
  }

  finishReparation(): void {
    if (this.reparation && this.reparation.status !== ReparationStatus.Terminee) {
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
} 