import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { Reparation, EtapeReparation, CommentaireEtape, PhotoReparation, ReparationStatus, EtapeStatus } from '../models/reparation.model';

// Données Mock pour simuler une API
const MOCK_REPARATIONS: Reparation[] = [
  {
    _id: 'rep123',
    vehicule: {
      marque: 'Renault',
      modele: 'Clio IV',
      immatriculation: 'AB-123-CD',
      annee: 2018,
      kilometrage: 75000,
      photoUrl: 'https://images.caradisiac.com/images/9/8/1/6/199816/S0-renault-clio-4-reprise-problemes-electroniques-126883.jpg'
    },
    client: {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@email.com',
      telephone: '0612345678'
    },
    garage: {
      nom: 'Garage Central',
      adresse: '1 rue de la Paix, 75000 Paris',
      telephone: '0123456789'
    },
    mecanicienAssigné: {
      _id: 'mec456',
      nom: 'Martin',
      prenom: 'Pierre'
    },
    problemeDeclare: "Bruit étrange au niveau du moteur lors de l'accélération et perte de puissance.",
    dateCreation: new Date('2024-03-15T10:00:00Z'),
    dateDebutPrevue: new Date('2024-03-18T09:00:00Z'),
    dateFinPrevue: new Date('2024-03-20T17:00:00Z'),
    dateFinReelle: undefined,
    status: ReparationStatus.EnCours,
    etapes: [
      {
        _id: 'etape1',
        titre: 'Diagnostic initial',
        description: 'Vérification des codes erreurs et inspection visuelle du moteur.',
        status: EtapeStatus.Terminee,
        dateDebut: new Date('2024-03-18T09:30:00Z'),
        dateFin: new Date('2024-03-18T11:00:00Z'),
        commentaires: [
          { auteur: 'mecanicien', message: 'Diagnostic effectué. Problème identifié sur le turbo.', date: new Date('2024-03-18T11:05:00Z') }
        ]
      },
      {
        _id: 'etape2',
        titre: 'Commande pièce (Turbo)',
        status: EtapeStatus.EnCours,
        dateDebut: new Date('2024-03-18T11:15:00Z'),
        commentaires: [
           { auteur: 'mecanicien', message: 'Pièce commandée chez le fournisseur.', date: new Date('2024-03-18T11:20:00Z') },
           { auteur: 'client', message: 'Merci pour la mise à jour. Combien de temps environ pour la livraison ?', date: new Date('2024-03-18T14:00:00Z')},
           { auteur: 'mecanicien', message: 'Normalement 2 jours ouvrés.', date: new Date('2024-03-18T15:30:00Z') }
        ]
      },
      {
        _id: 'etape3',
        titre: 'Remplacement du turbo',
        status: EtapeStatus.EnAttente,
        commentaires: []
      },
       {
        _id: 'etape4',
        titre: 'Tests et validation',
        status: EtapeStatus.EnAttente,
        commentaires: []
      }
    ],
    photos: [
      { url: 'https://example.com/photo_moteur1.jpg', description: 'Vue générale moteur', dateAjout: new Date('2024-03-18T10:00:00Z'), etapeAssociee: 'etape1' },
      { url: 'https://example.com/photo_turbo_avant.jpg', description: 'Turbo avant démontage', dateAjout: new Date('2024-03-18T10:30:00Z'), etapeAssociee: 'etape1' }
    ],
    descriptionTravaux: 'Diagnostique et remplacement du turbocompresseur.',
    coutEstime: 1200,
    coutTotal: undefined
  },
  {
    _id: 'rep456',
    vehicule: {
      marque: 'Peugeot',
      modele: '308',
      immatriculation: 'EF-456-GH',
      annee: 2020,
      kilometrage: 42000,
      photoUrl: undefined
    },
    client: {
      nom: 'Durand',
      prenom: 'Sophie',
      email: 'sophie.durand@email.com',
      telephone: '0698765432'
    },
    garage: {
      nom: 'Garage Central',
      adresse: '1 rue de la Paix, 75000 Paris',
      telephone: '0123456789'
    },
    mecanicienAssigné: undefined,
    problemeDeclare: 'Révision annuelle et changement plaquettes de frein avant.',
    dateCreation: new Date('2024-03-20T14:00:00Z'),
    dateDebutPrevue: new Date('2024-04-02T09:00:00Z'),
    dateFinPrevue: new Date('2024-04-02T17:00:00Z'),
    dateFinReelle: undefined,
    status: ReparationStatus.Validee,
    etapes: [
       { _id: 'etape5', titre: 'Révision générale', status: EtapeStatus.EnAttente, commentaires: [] },
       { _id: 'etape6', titre: 'Changement plaquettes avant', status: EtapeStatus.EnAttente, commentaires: [] },
    ],
    photos: [],
    descriptionTravaux: undefined,
    coutEstime: 350,
    coutTotal: undefined
  }
];


@Injectable({
  providedIn: 'root'
})
export class ReparationService {

  // Utilisation d'une copie profonde pour éviter la mutation directe du mock lors des updates
  // Attention: JSON.parse(JSON.stringify()) convertit les Dates en string ISO
  private currentReparations: any[] = JSON.parse(JSON.stringify(MOCK_REPARATIONS));
  private networkDelay = 500; // Simuler une latence réseau (ms)

  constructor() {
      // Convertir les dates stringifiées en objets Date une fois au démarrage
      this.currentReparations = this.parseDatesInReparations(this.currentReparations);
  }

  /**
   * Récupère toutes les réparations.
   */
  getReparations(): Observable<Reparation[]> {
    console.log('ReparationService: fetching all reparations (mock)');
    // Retourne une copie pour éviter les modifications externes non désirées
    // Pas besoin de re-parser les dates ici car elles sont déjà des objets Date dans currentReparations
    const reparationsCopy = JSON.parse(JSON.stringify(this.currentReparations)); // Copie profonde pour l'isolation
    return of(this.parseDatesInReparations(reparationsCopy)).pipe( // Re-parse après stringify pour le retour
      delay(this.networkDelay),
      tap(data => console.log(`ReparationService: fetched ${data.length} reparations`))
    );
  }

  /**
   * Récupère une réparation par son ID.
   */
  getReparationById(id: string): Observable<Reparation | undefined> {
    console.log(`ReparationService: fetching reparation by id ${id} (mock)`);
    // find() retourne une référence, pas une copie
    const reparation = this.currentReparations.find(r => r._id === id);
    // Retourne une copie profonde pour éviter les modifications externes non désirées
    const reparationCopy = reparation ? JSON.parse(JSON.stringify(reparation)) : undefined;

    return of(reparationCopy).pipe(
      delay(this.networkDelay),
      tap(data => console.log(`ReparationService: fetched reparation ${data?._id}`)),
      map(rep => rep ? this.parseDatesInReparation(rep) : undefined) // Re-parse après stringify
    );
  }

  /**
   * Met à jour le statut global d'une réparation.
   */
  updateReparationStatus(id: string, status: ReparationStatus, dateFinReelle?: Date): Observable<Reparation> {
    console.log(`ReparationService: updating reparation ${id} status to ${status} (mock)`);
    const index = this.currentReparations.findIndex(r => r._id === id);
    if (index !== -1) {
      const reparationToUpdate = this.currentReparations[index]; // Référence à l'objet dans le tableau
      reparationToUpdate.status = status;

      if (dateFinReelle !== undefined) {
          reparationToUpdate.dateFinReelle = dateFinReelle; // Stocker l'objet Date
      } else if (status === ReparationStatus.Terminee && !reparationToUpdate.dateFinReelle) {
          reparationToUpdate.dateFinReelle = new Date(); // Stocker le nouvel objet Date
      }

      const updatedReparationCopy = JSON.parse(JSON.stringify(reparationToUpdate)); // Copie profonde pour le retour
      return of(this.parseDatesInReparation(updatedReparationCopy)).pipe( // Re-parse après stringify
        delay(this.networkDelay),
        tap(data => console.log(`ReparationService: updated reparation ${data._id} status`))
      );
    } else {
      console.error(`ReparationService: Reparation with id ${id} not found for status update.`);
      return throwError(() => new Error(`Reparation non trouvée (id: ${id})`));
    }
  }

  /**
   * Met à jour le statut d'une étape spécifique d'une réparation.
   */
  updateStepStatus(reparationId: string, etapeId: string, status: EtapeStatus, dateFin?: Date): Observable<EtapeReparation> {
     console.log(`ReparationService: updating step ${etapeId} in reparation ${reparationId} to status ${status} (mock)`);
     const reparationIndex = this.currentReparations.findIndex(r => r._id === reparationId);
     if (reparationIndex === -1) {
       console.error(`ReparationService: Reparation with id ${reparationId} not found for step update.`);
       return throwError(() => new Error(`Réparation non trouvée (id: ${reparationId})`));
     }

     const etapeIndex = this.currentReparations[reparationIndex].etapes.findIndex((e: EtapeReparation) => e._id === etapeId);
     if (etapeIndex === -1) {
       console.error(`ReparationService: Step with id ${etapeId} not found in reparation ${reparationId}.`);
       return throwError(() => new Error(`Étape non trouvée (id: ${etapeId})`));
     }

     const etapeToUpdate = this.currentReparations[reparationIndex].etapes[etapeIndex]; // Référence
     etapeToUpdate.status = status;

     if (dateFin !== undefined) {
         etapeToUpdate.dateFin = dateFin; // Stocker l'objet Date
     } else if (status === EtapeStatus.Terminee && !etapeToUpdate.dateFin) {
         etapeToUpdate.dateFin = new Date(); // Stocker le nouvel objet Date
     }

     if (status === EtapeStatus.EnCours && !etapeToUpdate.dateDebut) {
         etapeToUpdate.dateDebut = new Date(); // Stocker le nouvel objet Date
     }

     const updatedEtapeCopy = JSON.parse(JSON.stringify(etapeToUpdate)); // Copie profonde pour le retour

     return of(this.parseDatesInEtape(updatedEtapeCopy)).pipe( // Re-parse après stringify
       delay(this.networkDelay),
       tap(data => console.log(`ReparationService: updated step ${data._id} status`))
     );
  }


  /**
   * Ajoute un commentaire à une étape spécifique.
   */
  addCommentToStep(reparationId: string, etapeId: string, auteur: string, message: string): Observable<EtapeReparation> {
    console.log(`ReparationService: adding comment to step ${etapeId} in reparation ${reparationId} (mock)`);
    const reparationIndex = this.currentReparations.findIndex(r => r._id === reparationId);
    if (reparationIndex === -1) {
      return throwError(() => new Error(`Réparation non trouvée (id: ${reparationId})`));
    }

    const etapeIndex = this.currentReparations[reparationIndex].etapes.findIndex((e: EtapeReparation) => e._id === etapeId);
    if (etapeIndex === -1) {
      return throwError(() => new Error(`Étape non trouvée (id: ${etapeId})`));
    }

    const etapeToUpdate = this.currentReparations[reparationIndex].etapes[etapeIndex]; // Référence

    const nouveauCommentaire: CommentaireEtape = {
      auteur: auteur,
      message: message,
      date: new Date() // Stocker l'objet Date
    };

    // Assurer que commentaires existe
    if (!etapeToUpdate.commentaires) {
        etapeToUpdate.commentaires = [];
    }
    etapeToUpdate.commentaires.push(nouveauCommentaire);

    const updatedEtapeCopy = JSON.parse(JSON.stringify(etapeToUpdate)); // Copie profonde pour retour

     return of(this.parseDatesInEtape(updatedEtapeCopy)).pipe( // Re-parse après stringify
       delay(this.networkDelay / 2),
       tap(data => console.log(`ReparationService: added comment to step ${data._id}`))
     );
  }

   /**
    * Ajoute une photo à une réparation.
    */
   addPhotoToReparation(reparationId: string, photoUrl: string, description?: string, etapeAssociee?: string): Observable<Reparation> {
     console.log(`ReparationService: adding photo to reparation ${reparationId} (mock)`);
     const reparationIndex = this.currentReparations.findIndex(r => r._id === reparationId);
     if (reparationIndex === -1) {
       return throwError(() => new Error(`Réparation non trouvée (id: ${reparationId})`));
     }

     const reparationToUpdate = this.currentReparations[reparationIndex]; // Référence

     const nouvellePhoto: PhotoReparation = {
       url: photoUrl,
       description: description,
       dateAjout: new Date(), // Stocker l'objet Date
       etapeAssociee: etapeAssociee
     };

      // Assurer que photos existe
     if (!reparationToUpdate.photos) {
        reparationToUpdate.photos = [];
     }
     reparationToUpdate.photos.push(nouvellePhoto);

     const updatedReparationCopy = JSON.parse(JSON.stringify(reparationToUpdate)); // Copie profonde pour retour

     return of(this.parseDatesInReparation(updatedReparationCopy)).pipe( // Re-parse après stringify
       delay(this.networkDelay),
       tap(data => console.log(`ReparationService: added photo to reparation ${data._id}`))
     );
   }

  // --- Helpers privés pour la gestion des dates après JSON.parse --- //

  private parseDatesInReparations(reparations: any[]): Reparation[] {
      return reparations.map(rep => this.parseDatesInReparation(rep));
  }

  private parseDatesInReparation(reparation: any): Reparation {
      if (!reparation) return reparation;
      // Dates directes de la réparation
      if (reparation.dateCreation && typeof reparation.dateCreation === 'string') reparation.dateCreation = new Date(reparation.dateCreation);
      if (reparation.dateDebutPrevue && typeof reparation.dateDebutPrevue === 'string') reparation.dateDebutPrevue = new Date(reparation.dateDebutPrevue);
      if (reparation.dateFinPrevue && typeof reparation.dateFinPrevue === 'string') reparation.dateFinPrevue = new Date(reparation.dateFinPrevue);
      if (reparation.dateFinReelle && typeof reparation.dateFinReelle === 'string') reparation.dateFinReelle = new Date(reparation.dateFinReelle);

      // Dates dans les étapes
      if (reparation.etapes) {
          reparation.etapes = reparation.etapes.map((etape: any) => this.parseDatesInEtape(etape));
      }

      // Dates dans les photos
      if (reparation.photos) {
          reparation.photos = reparation.photos.map((photo: any) => {
              if (photo.dateAjout && typeof photo.dateAjout === 'string') photo.dateAjout = new Date(photo.dateAjout);
              return photo;
          });
      }
      return reparation as Reparation;
  }

  private parseDatesInEtape(etape: any): EtapeReparation {
      if (!etape) return etape;
      // Dates directes de l'étape
      if (etape.dateDebut && typeof etape.dateDebut === 'string') etape.dateDebut = new Date(etape.dateDebut);
      if (etape.dateFin && typeof etape.dateFin === 'string') etape.dateFin = new Date(etape.dateFin);

      // Dates dans les commentaires
      if (etape.commentaires) {
          etape.commentaires = etape.commentaires.map((commentaire: any) => {
              if (commentaire.date && typeof commentaire.date === 'string') commentaire.date = new Date(commentaire.date);
              return commentaire;
          });
      }
      return etape as EtapeReparation;
  }

} 