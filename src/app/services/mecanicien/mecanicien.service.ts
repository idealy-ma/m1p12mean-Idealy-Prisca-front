import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

// Interface exacte des données renvoyées par l'API
interface MecanicienResponse {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone: string;
  adresse: string;
  estActif: boolean;
  tarifHoraire: number;
  specialite?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface utilisée dans l'application
export interface Mecanicien {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone: string;
  adresse: string;
  estActif: boolean;
  tarifHoraire: number;
  specialite?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class MecanicienService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Convertir le format de l'API en format application
  private mapMecanicienResponseToMecanicien(response: MecanicienResponse): Mecanicien {
    return {
      ...response,
      specialite: response.specialite
    };
  }

  // Récupérer les mécaniciens disponibles à une date précise
  getMecaniciensDisponibles(date: string): Observable<Mecanicien[]> {    
    return this.http.get<any>(`${this.apiUrl}/manager/mecaniciens/disponibles?date=${date}`)
      .pipe(
        map(response => {
          if (response && response.success) {
            return response.data.map((mec: MecanicienResponse) => this.mapMecanicienResponseToMecanicien(mec));
          }
          return [];
        })
      );
  }
} 