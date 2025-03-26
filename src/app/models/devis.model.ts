// Interfaces DTO (Data Transfer Object) - Format exact du backend
export interface DevisDTO {
  _id?: string;
  client?: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    id?: string;
  };
  vehicule?: {
    _id: string;
    marque: string;
    modele: string;
    immatricule: string;
  };
  probleme?: string;
  dateCreation?: Date;
  status?: string;
  total?: number;
  preferredDate?: Date;
  urlPhotos?: string[];
  servicesChoisis?: ServiceChoisiDTO[];
  packsChoisis?: PackChoisiDTO[];
  lignesSupplementaires?: LigneSupplementaireDTO[];
  mecaniciensTravaillant?: MecanicienTravailDTO[];
  createdAt?: Date;
  updatedAt?: Date;
  id?: string;
}

export interface ServiceChoisiDTO {
  _id?: string;
  service: {
    _id?: string;
    name: string;
    type?: string;
    prix: number;
    descri?: string;
    __v?: number;
    id?: string;
  };
  note?: string;
  priorite?: string;
  id?: string;
}

export interface PackChoisiDTO {
  _id?: string;
  servicePack: {
    _id?: string;
    name: string;
    services?: string[];
    remise?: number;
    __v?: number;
    id?: string;
  };
  note?: string;
  priorite?: string;
  id?: string;
}

export interface LigneSupplementaireDTO {
  _id?: string;
  designation?: string;
  description?: string;
  quantite?: number;
  prixUnitaire?: number;
  typeElement?: 'piece' | 'service' | 'main_oeuvre' | 'autre';
  priorite?: string;
  completed?: boolean;
}

export interface MecanicienTravailDTO {
  _id?: string;
  mecanicien?: {
    _id: string;
    nom: string;
    prenom: string;
    tauxHoraire?: number;
  };
  tempsEstime?: number;
  tauxHoraire?: number;
  dateDebut?: Date;
  dateFin?: Date;
}

// Interfaces pour l'application (adaptées à l'utilisation dans le frontend)
export interface Devis {
  _id?: string;
  client?: Client;
  vehicule?: Vehicule;
  probleme?: string;
  dateCreation?: Date;
  status?: string;
  montantEstime?: number;
  commentaire?: string;
  items?: DevisItem[];
  servicesPreselectionnes?: ServicePreselectionne[];
  preferredDate?: Date;
  photoUrl?: string;
  secondPhotoUrl?: string;
  id?: string;

  // Propriétés adaptées du DTO
  servicesChoisis?: ServiceChoisi[];
  packsChoisis?: PackChoisi[];
  urlPhotos?: string[];
  lignesSupplementaires?: LigneSupplementaire[];
  mecaniciensTravaillant?: MecanicienTravail[];
  total?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Client {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  id?: string;
}

export interface Vehicule {
  _id: string;
  marque: string;
  modele: string;
  immatricule: string;
}

export interface DevisItem {
  _id?: string;
  nom: string;
  type: 'piece' | 'service' | 'main_oeuvre' | 'autre';
  quantite: number;
  prixUnitaire: number;
  completed?: boolean;
  priorite?: 'basse' | 'moyenne' | 'haute';
  note?: string;
  mecanicienId?: string;
  tauxStandard?: number;
  estPreselectionne?: boolean;
}

export interface ServicePreselectionne {
  _id?: string;
  nom: string;
  description?: string;
  prix: number;
  type: 'service' | 'pack';
}

export interface ServiceChoisi {
  _id?: string;
  service: {
    _id?: string;
    name: string;
    type?: string;
    prix: number;
    descri?: string;
    id?: string;
  };
  note?: string;
  priorite?: string;
  id?: string;
}

export interface PackChoisi {
  _id?: string;
  servicePack: {
    _id?: string;
    name: string;
    services?: string[];
    remise?: number;
    id?: string;
  };
  note?: string;
  priorite?: string;
  id?: string;
}

export interface LigneSupplementaire {
  _id?: string;
  designation?: string;
  description?: string;
  quantite?: number;
  prixUnitaire?: number;
  typeElement?: 'piece' | 'service' | 'main_oeuvre' | 'autre';
  priorite?: string;
  completed?: boolean;
}

export interface MecanicienTravail {
  _id?: string;
  mecanicien?: {
    _id: string;
    nom: string;
    prenom: string;
    tauxHoraire?: number;
  };
  tempsEstime?: number;
  tauxHoraire?: number;
  dateDebut?: Date;
  dateFin?: Date;
}

// Fonction pour convertir DevisDTO en Devis
export function mapDevisDTOToDevis(devisDTO: DevisDTO): Devis {
  const devis: Devis = {
    ...devisDTO,
    // Ajouter les champs photoUrl et secondPhotoUrl à partir de urlPhotos
    photoUrl: devisDTO.urlPhotos && devisDTO.urlPhotos.length > 0 ? devisDTO.urlPhotos[0] : undefined,
    secondPhotoUrl: devisDTO.urlPhotos && devisDTO.urlPhotos.length > 1 ? devisDTO.urlPhotos[1] : undefined,
  };

  return devis;
} 