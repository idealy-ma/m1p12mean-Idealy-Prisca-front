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
    tarifHoraire?: number;
  };
  heureDeTravail?: number;
  tarifHoraire?: number;
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
  type: 'piece' | 'service' | 'main_oeuvre' | 'autre' | 'pack';
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
  id?: string;
  nom?: string;
  description?: string;
  quantite?: number;
  prix?: number;
  type?: 'piece' | 'service' | 'main_oeuvre' | 'autre';
  priorite?: string;
  completed?: boolean;
}

export interface MecanicienTravail {
  _id?: string;
  mecanicien: {
    _id: string;
    nom: string;
    prenom: string;
    tarifHoraire?: number;
  };
  heureDeTravail?: number;
  tarifHoraire?: number;
  dateDebut?: Date;
  dateFin?: Date;
}

// Fonction pour convertir DevisDTO en Devis
export function mapDevisDTOToDevis(devisDTO: DevisDTO): Devis {
  // Commencer par copier les propriétés de base
  const baseDevis = { ...devisDTO };

  // Supprimer les propriétés spécifiques au DTO qui ne sont pas dans Devis
  // delete baseDevis.id; // Ou gérer autrement si nécessaire

  const devis: Devis = {
    ...baseDevis, // Copier les champs compatibles
    // Assigner explicitement les champs qui existent dans Devis mais pas (ou différemment) dans DTO si nécessaire
    _id: devisDTO._id,
    client: devisDTO.client, // Assumant que la structure DTO correspond à l'interface Client
    vehicule: devisDTO.vehicule, // Assumant que la structure DTO correspond à l'interface Vehicule
    montantEstime: devisDTO.total, // Mapper total DTO vers montantEstime ? (À vérifier)
    // Gérer les photos
    photoUrl: devisDTO.urlPhotos && devisDTO.urlPhotos.length > 0 ? devisDTO.urlPhotos[0] : undefined,
    secondPhotoUrl: devisDTO.urlPhotos && devisDTO.urlPhotos.length > 1 ? devisDTO.urlPhotos[1] : undefined,
    urlPhotos: devisDTO.urlPhotos,

    // Mapper et FILTRER les tableaux imbriqués pour garantir la cohérence
    servicesChoisis: (devisDTO.servicesChoisis || [])
      .filter(sc => sc.service != null && sc.service.prix != null) // Filtrer les services invalides ou sans prix
      .map(sc => ({ ...sc, service: { ...sc.service } })), // Copier pour éviter les mutations
      
    packsChoisis: (devisDTO.packsChoisis || [])
      .filter(pc => pc.servicePack != null) // Filtrer les packs invalides
      .map(pc => ({ ...pc, servicePack: { ...pc.servicePack } })), // Copier

    lignesSupplementaires: (devisDTO.lignesSupplementaires || [])
       // Mapper DTO vers LigneSupplementaire si les structures diffèrent, sinon simple copie
      .map(ls => ({ ...ls })), // Simple copie si la structure correspond
      
    mecaniciensTravaillant: (devisDTO.mecaniciensTravaillant || [])
      // Filtrer aussi sur la présence de l'ID du mécanicien
      .filter(mt => mt.mecanicien != null && mt.mecanicien._id != null)
      .map(mt => ({
         ...mt,
         // Assurer la conformité du type pour mecanicien._id
         mecanicien: { ...mt.mecanicien, _id: mt.mecanicien!._id! }
      }) as MecanicienTravail), // Cast explicite si nécessaire après le filter
  };

  // Nettoyer les propriétés potentiellement undefined qui viennent du spread
  // delete devis.id;

  return devis;
} 