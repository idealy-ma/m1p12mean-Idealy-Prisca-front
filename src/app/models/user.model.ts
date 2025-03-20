export interface User {
  _id?: string;
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string;
  role: 'client' | 'manager' | 'mecanicien';
  telephone?: string;
  adresse?: string;
  estActif?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} 