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
} 