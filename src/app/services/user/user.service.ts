import { HttpClient } from '@angular/common/http';
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
  getEmployees(): Observable<User[]> {
    return this.http.get<User[]>(`${this.rootUrl}/manager/employees`);
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
} 