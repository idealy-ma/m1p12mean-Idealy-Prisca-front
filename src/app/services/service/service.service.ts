import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Service } from '../../models/service.model';
import { ApiConfiguration } from '../api-configuration';
import { BaseService } from '../base-service';

@Injectable({
  providedIn: 'root'
})
export class ServiceService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  createService(service: Service): Observable<any> {
    return this.http.post(`${this.rootUrl}/manager/service`, service);
  }
  getServices() {
    return this.http.get<{ message: string; data: Service[] }>(`${this.rootUrl}/manager/service`)
      .pipe(
        map(response => response.data) // 🔹 Récupère uniquement le tableau de services
      );
  }  
  
  createServicePack(pack: any) {
    return this.http.post(`${this.rootUrl}/manager/packs`, pack);
  }
}
