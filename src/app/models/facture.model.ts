export interface LigneFacture {
  id: string;
  designation: string; 
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  type: 'piece' | 'main_oeuvre';
  reference?: string; // Pour les pièces
}

export interface Transaction {
  id: string;
  date: Date;
  montant: number;
  modePaiement: 'especes' | 'carte' | 'virement' | 'cheque' | 'en_ligne';
  reference?: string;
  statut: 'en_attente' | 'validee' | 'rejetee' | 'remboursee';
}

export interface PaymentInfo {
  montant: number;
  modePaiement: 'especes' | 'carte' | 'virement' | 'cheque' | 'en_ligne';
  reference?: string;
  informationsCarteBancaire?: {
    numero: string;
    dateExpiration: string;
    cvv: string;
    nomPorteur: string;
  };
}

export interface Facture {
  id: string;
  numeroFacture: string;
  dateEmission: Date;
  dateEcheance: Date;
  client: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    adresse?: string;
  };
  vehicule: {
    id: string;
    marque: string;
    modele: string;
    immatriculation: string;
    annee?: number;
    kilometrage?: number;
  };
  reparationId: string;
  devisId?: string;
  lignesFacture: LigneFacture[];
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  remise?: {
    montant: number;
    pourcentage?: number;
    description: string;
  };
  statut: 'brouillon' | 'validee' | 'emise' | 'payee' | 'partiellement_payee' | 'annulee' | 'en_retard';
  transactions: Transaction[];
  commentaires?: string;
  delaiPaiement: number; // en jours
  creePar: string; // ID de l'utilisateur
  validePar?: string; // ID du manager
}

export interface FactureFilters {
  statut?: 'brouillon' | 'validee' | 'emise' | 'payee' | 'partiellement_payee' | 'annulee' | 'en_retard';
  dateDebut?: Date | string;
  dateFin?: Date | string;
  client?: string;
  montantMin?: number | string;
  montantMax?: number | string;
  recherche?: string; // Recherche globale
}

export interface FactureStats {
  totalFactures: number;
  totalMontant: number;
  nombrePayees: number;
  nombreEnRetard: number;
  tempsMoyenPaiement: number; // en jours
} 