import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicule } from '../../models/vehicule.model';
import { ApiConfiguration } from '../api-configuration';
import { BaseService } from '../base-service';

@Injectable({
  providedIn: 'root'
})
export class VehiculeService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

    
  createVehicule(data: Vehicule): Observable<Vehicule> {
    return this.http.post<Vehicule>(`${this.rootUrl}/client/vehicules`, data);
  }
}
