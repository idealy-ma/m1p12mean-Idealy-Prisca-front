export interface Notification {
  _id: string;            // ID unique de la notification
  recipient?: string;       // ID de l'utilisateur destinataire (peut être absent si recipientRole est défini)
  recipientRole?: string;   // Rôle ciblé (ex: 'manager')
  sender?: {              // Informations sur l'expéditeur (populé par le backend)
    _id: string;
    nom: string;
    prenom: string;
  };
  type: string;            // Type de notification (ex: 'DEVIS_ACCEPTED')
  message: string;         // Message affiché
  link: string;            // Lien relatif (ex: '/client/devis/...')
  entityId?: string;       // ID de l'entité liée (Devis, Reparation...)
  isRead: boolean;         // Statut lu/non lu
  createdAt: Date;         // Date de création
  updatedAt?: Date;        // Date de mise à jour
} 