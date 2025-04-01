import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Vehicule } from '../../../models/vehicule.model';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { VehiculeService } from '../../../services/vehicules/vehicule.service';

@Component({
  selector: 'app-add-vehicule',
  templateUrl: './add-vehicule.component.html',
  styleUrls: ['./add-vehicule.component.css']
})
export class AddVehiculeComponent implements OnInit {
  vehiculeForm!: FormGroup;
  todayDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
  selectedFiles: File[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private vehiculeService: VehiculeService,
    private supaBaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.vehiculeForm = this.fb.group({
      immatricule: ['', Validators.required],
      marque: ['', Validators.required],
      modele: ['', Validators.required],
      carburant: ['', Validators.required],
      photos:['']
    });
  }

  onFileSelect(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  async onSubmit() {
    if (this.vehiculeForm.valid) {
      this.isLoading = true;
      const vehiculeData: Vehicule = {
        immatricule: this.vehiculeForm.value.immatricule,
        marque: this.vehiculeForm.value.marque,
        modele: this.vehiculeForm.value.modele,
        carburant: this.vehiculeForm.value.carburant,
        dateAjout: new Date(), // Date actuelle au format Date
        photos: this.selectedFiles.map(file => file.name)
      };
      if (this.selectedFiles) {
        // Upload des images et récupération des URLs publiques
        vehiculeData.photos = await this.supaBaseService.uploadMultipleImages(this.selectedFiles);
      }
      this.vehiculeService.createVehicule(vehiculeData).subscribe({
        next: (response) => {
          console.log('Véhicule ajouté avec succès', response);
          this.isLoading = false;
          this.router.navigate(['/client/vehicules']);
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout du véhicule', err);
          this.isLoading = false;
        },
      });
    }
  }
  
}
