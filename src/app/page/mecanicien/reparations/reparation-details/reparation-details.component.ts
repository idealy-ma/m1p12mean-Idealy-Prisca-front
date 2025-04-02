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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReparation(id);
    } else {
      this.error = 'ID de réparation non fourni';
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
      if (this.reparation.etapesSuivi) {
        this.reparation.etapesSuivi.forEach(etape => {
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
              const newCommentFromServer = updatedEtape.commentaires?.[updatedEtape.commentaires.length - 1];
              if (newCommentFromServer) {
                const commentFullId = this.getCommentId(etapeId, newCommentFromServer);
                this.commentExpandedState[commentFullId] = true;
              }
            }
            this.newComment[etapeId] = '';
            console.log(`Comment added to step ${etapeId} successfully`);
          },
          error: err => {
            console.error(`Error adding comment to step ${etapeId}:`, err);
            this.error = err.userMessage || `Erreur lors de l'ajout du commentaire`;
          }
        });
    }
  }

  uploadPhoto(): void {
    const description = this.photoDescription?.trim();
    if (this.reparation && this.newPhotoFile && description) {
      this.photoUploading = true;
      this.photoError = null;

      const formData = new FormData();
      formData.append('photo', this.newPhotoFile, this.newPhotoFile.name);
      formData.append('description', description);
      if (this.photoEtapeId) {
        formData.append('etapeAssociee', this.photoEtapeId);
      }

      this.reparationService.addPhotoToReparation(this.reparation._id, formData)
        .pipe(
          finalize(() => this.photoUploading = false)
        )
        .subscribe({
          next: (nouvellePhoto: PhotoReparation) => {
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
            console.log('Photo added successfully');
          },
          error: err => {
            console.error('Error adding photo:', err);
            this.photoError = err.userMessage || `Erreur lors de l'ajout de la photo`;
          }
        });
    } else if (!this.newPhotoFile) {
        this.photoError = "Veuillez sélectionner un fichier image.";
    } else if (!description) {
      this.photoError = "La description de la photo est requise.";
    }
  }

  // Méthode appelée par l'événement (change) de la checkbox
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
    const commentIdentifier = commentaire.date.getTime().toString();
    return `${etapeId}-${commentIdentifier}`;
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
} 