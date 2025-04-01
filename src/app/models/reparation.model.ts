export interface CommentaireEtape {
  auteur: string; // 'client' or 'mecanicien'
  message: string;
  date: Date;
}

export interface EtapeReparation {
  _id: string;
  titre: string;
  description?: string;
  status: 'en_attente' | 'en_cours' | 'terminee' | 'annulee';
  dateDebut?: Date;
  dateFin?: Date;
  commentaires: CommentaireEtape[];
}

export interface PhotoReparation {
  url: string;
  description?: string;
  dateAjout: Date;
  etapeAssociee?: string; // Optional link to an EtapeReparation _id
}

export interface Reparation {
  _id: string;
  vehicule: {
    marque: string;
    modele: string;
    immatriculation: string;
    annee?: number;
    kilometrage?: number;
    photoUrl?: string; // URL de la photo principale du véhicule
  };
  client: {
    nom: string;
    prenom: string;
    email?: string;
    telephone?: string;
  };
  garage: {
    nom: string;
    adresse: string;
    telephone?: string;
  };
  mecanicienAssigné?: {
    _id: string;
    nom: string;
    prenom: string;
  };
  problemeDeclare: string;
  dateCreation: Date;
  dateDebutPrevue?: Date;
  dateFinPrevue?: Date;
  dateFinReelle?: Date; // Renommé depuis dateFin
  status: 'en_attente_validation' | 'validée' | 'en_cours' | 'en_pause' | 'terminée' | 'annulée' | 'refusée';
  etapes: EtapeReparation[];
  photos: PhotoReparation[];
  descriptionTravaux?: string; // Description générale par le mécanicien
  coutEstime?: number;
  coutTotal?: number; // Sera rempli par la facture
}

// Enum pour les statuts (optionnel mais peut être utile)
export enum ReparationStatus {
  EnAttenteValidation = 'en_attente_validation',
  Validee = 'validée',
  EnCours = 'en_cours',
  EnPause = 'en_pause',
  Terminee = 'terminée',
  Annulee = 'annulée',
  Refusee = 'refusée'
}

export enum EtapeStatus {
  EnAttente = 'en_attente',
  EnCours = 'en_cours',
  Terminee = 'terminee',
  Annulee = 'annulee'
} 