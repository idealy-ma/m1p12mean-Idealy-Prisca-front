export interface Devis {
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
  description?: string;
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