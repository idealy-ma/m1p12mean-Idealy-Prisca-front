import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../models/user.model';
import { ApiConfiguration } from '../api-configuration';
import { BaseService } from '../base-service';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  // Créer un nouvel employé (mécanicien)
  createEmployee(employee: User): Observable<any> {
    return this.http.post(`${this.rootUrl}/manager/employees`, employee);
  }

  // Récupérer la liste des employés (mécaniciens)
  getEmployees(filters: any = {}, page: number = 1, limit: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    // Ajouter les filtres à l'URL si définis
    if (filters.nom) params = params.set('nom', filters.nom);
    if (filters.prenom) params = params.set('prenom', filters.prenom);
    if (filters.role) params = params.set('role', filters.role);
    if (filters.estActif !== undefined) params = params.set('estActif', filters.estActif.toString());

    console.log(params);
    
    
    return this.http.get<any>(`${this.rootUrl}/manager/employees`, { params });
  }

  // Récupérer un employé par son ID
  getEmployeeById(id: string): Observable<User> {
    return this.http.get<User>(`${this.rootUrl}/manager/employees/${id}`);
  }

  // Mettre à jour un employé
  updateEmployee(id: string, employee: User): Observable<any> {
    return this.http.put(`${this.rootUrl}/manager/employees/${id}`, employee);
  }

  // Activer/désactiver un employé
  toggleEmployeeStatus(id: string, estActif: boolean): Observable<any> {
    return this.http.patch(`${this.rootUrl}/manager/employees/${id}/status`, { estActif });
  }

  // Suspendre un utilisateur
  suspendUser(id: string): Observable<any> {
    return this.http.patch(`${this.rootUrl}/manager/users/${id}/suspend`, {});
  }

  // Réactiver un utilisateur
  reactivateUser(id: string): Observable<any> {
    return this.http.patch(`${this.rootUrl}/manager/users/${id}/reactivate`, {});
  }

  // Supprimer un employé
  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.rootUrl}/manager/employees/${id}`);
  }

  // Changer le rôle d'un employé (manager <-> mécanicien)
  changeEmployeeRole(id: string, role: 'manager' | 'mecanicien'): Observable<any> {
    return this.http.patch(`${this.rootUrl}/manager/employees/${id}/role`, { role });
  }

  /**
   * Récupère les informations du profil de l'utilisateur connecté
   * @returns Un Observable contenant les données du profil utilisateur
   */
  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.rootUrl}/users/profile`);
  }

  /**
   * Met à jour les informations du profil de l'utilisateur connecté
   * @param userData Les données à mettre à jour (nom, prenom, telephone, adresse, motDePasse)
   * @returns Un Observable contenant la réponse de l'API
   */
  updateUserProfile(userData: any): Observable<any> {
    return this.http.put<any>(`${this.rootUrl}/users/profile`, userData);
  }

  /**
   * Récupère les utilisateurs filtrés par rôle.
   * @param role Le rôle à filtrer ('client', 'mecanicien', 'manager').
   * @returns Un Observable contenant la liste des utilisateurs trouvés.
   */
  getUsersByRole(role: 'client' | 'mecanicien' | 'manager'): Observable<{ success: boolean, count: number, data: User[] }> {
    // Utiliser l'endpoint spécifique du backend pour récupérer par rôle
    const url = `${this.rootUrl}/manager/users/role/${role}`;
    console.log(`UserService: fetching users by role ${role} from API: ${url}`);
    return this.http.get<{ success: boolean, count: number, data: User[] }>(url);
  }
} 