import { Devis } from "./devis.model";

export interface CommentaireEtape {
  // _id?: string; // Optionnel si l'API ne le retourne pas ou si Mongoose ne le met pas par défaut dans le sous-document
  auteur: string; // 'client' or 'mecanicien' ou ID/Objet populé
  message: string;
  date: Date;
  expanded?: boolean; // Ajouter cette propriété optionnelle pour l'UI
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

export interface User {
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
}

export interface Vehicule {
  marque: string;
  modele: string;
  immatriculation: string;
  annee?: number;
  kilometrage?: number;
  photoUrl?: string; // URL de la photo principale du véhicule
}

export interface Service {
  // Add appropriate properties for the Service model
}

export interface ServicePack {
  // Add appropriate properties for the ServicePack model
}

export interface Reparation {
  _id: string;
  devisOrigine: Devis;
  client: User;
  vehicule: Vehicule;
  mecaniciensAssignes: Array<{ mecanicien: User }>;
  statusReparation: ReparationStatus;
  servicesInclus: Array<{ service: Service, prix: number, note: string }>;
  packsInclus: Array<{ servicePack: ServicePack, prix: number, note: string }>;
  problemeDeclare: string;
  etapesSuivi: Array<EtapeReparation>;
  photos: Array<PhotoReparation>;
  notesInternes: Array<{ auteur: User, message: string, date: Date }>;
  dateCreationReparation: Date;
  dateDebutPrevue: Date;
  dateFinPrevue: Date;
  dateDebutReelle: Date;
  dateFinReelle: Date;
  coutEstime: number;
  coutFinal: number;
}

export enum ReparationStatus {
  Planifiee = 'Planifiée',
  EnCours = 'En cours',
  EnAttentePieces = 'En attente pièces',
  Terminee = 'Terminée',
  Facturee = 'Facturée',
  Annulee = 'Annulée'
}

export enum EtapeStatus {
  EnAttente = 'en_attente',
  EnCours = 'en_cours',
  Terminee = 'terminee',
  Annulee = 'annulee'
} 