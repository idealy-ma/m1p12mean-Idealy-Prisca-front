export interface Vehicule {
    _id?: string;         // ID généré par MongoDB (optionnel)
    immatricule: string;  // Numéro d'immatriculation (obligatoire)
    marque: string;       // Marque du véhicule (obligatoire)
    modele: string;       // Modèle du véhicule (obligatoire)
    dateAjout?: Date;     // Date d'ajout automatique
    photos?: string[];    // Liste des URLs des photos (optionnel)
}  