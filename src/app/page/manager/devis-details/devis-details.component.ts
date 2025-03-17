import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DevisService } from '../../../services/devis/devis.service';
import { Devis } from '../../../models/devis.model';

@Component({
  selector: 'app-devis-details',
  templateUrl: './devis-details.component.html',
  styleUrls: ['./devis-details.component.css']
})
export class DevisDetailsComponent implements OnInit {
  devis: Devis | null = null;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private devisService: DevisService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDevisDetails(id);
    }
  }

  loadDevisDetails(id: string): void {
    this.loading = true;
    this.error = null;

    this.devisService.getDevisById(id).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.devis = response.data;
        } else {
          this.error = 'Format de données invalide';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du devis', err);
        this.error = 'Erreur lors du chargement du devis';
        this.loading = false;
      }
    });
  }

  updateStatus(status: 'accepte' | 'refuse'): void {
    if (!this.devis || !this.devis._id) {
      this.error = 'ID du devis non disponible';
      return;
    }

    this.loading = true;
    this.error = null;

    this.devisService.updateDevis(this.devis._id, { status }).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.devis = response.data;
        } else {
          this.error = 'Erreur lors de la mise à jour du statut';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du statut', err);
        this.error = 'Erreur lors de la mise à jour du statut';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/manager/devis']);
  }
} 