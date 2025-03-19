import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Service } from '../../../models/service.model';
import { ServiceService } from '../../../services/service/service.service';

@Component({
  selector: 'app-add-service',
  templateUrl: './add-service.component.html',
  styleUrls: ['./add-service.component.css']
})
export class AddServiceComponent {
  serviceForm: FormGroup;
  serviceTypes: string[] = ['Standard', 'Premium'];

  constructor(private fb: FormBuilder, private serviceService: ServiceService) {
    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      prix: ['', [Validators.required, Validators.min(0)]],
      descri:[''],
    });
  }

  onSubmit(): void {
    if (this.serviceForm.valid) {
      const newService: Service = this.serviceForm.value;
      this.serviceService.createService(newService).subscribe({
        next: (response) => {
          alert('Service créé avec succès !');
          this.serviceForm.reset();
        },
        error: (error) => {
          alert('Erreur lors de la création du service');
          console.error(error);
        }
      });
    }
  }
}
