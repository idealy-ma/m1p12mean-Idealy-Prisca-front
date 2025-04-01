import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  private bucket = 'uploads'; // Nom du bucket Supabase

  async uploadMultipleImages(files: File[]): Promise<string[]> {
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${Date.now()}-${file.name}`;

      const { data, error } = await this.supabase.storage
        .from(this.bucket) // Nom de ton bucket Supabase
        .upload(filePath, file);

      if (error) {
        console.error(`Erreur d’upload du fichier ${file.name}:`, error);
        continue;
      }

      // Récupérer l'URL publique du fichier
      const publicUrl = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath).data.publicUrl;

      urls.push(publicUrl); // Ajouter l'URL publique à la liste
    }

    return urls; // Retourner les URLs publiques
  }
  
  
}