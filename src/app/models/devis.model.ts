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
  id?: string;
} 