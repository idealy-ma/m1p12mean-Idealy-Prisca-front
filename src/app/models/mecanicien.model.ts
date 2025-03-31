export interface Mecanicien {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  specialite?: string;
  tarifHoraire: number;
  estActif?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} 