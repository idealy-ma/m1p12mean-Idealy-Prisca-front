import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Facture, FactureFilters, FactureStats, Transaction, PaymentInfo } from '../models/facture.model';

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private apiUrl = `${environment.apiUrl}/factures`;

  // Données mockées
  private mockFactures: Facture[] = [];

  constructor(private http: HttpClient) {
    this.initMockData();
  }

  getFactures(filters?: FactureFilters): Observable<Facture[]> {
    let result = [...this.mockFactures];

    if (filters) {
      if (filters.statut) {
        result = result.filter(f => f.statut === filters.statut);
      }
      if (filters.dateDebut) {
        const dateDebut = new Date(filters.dateDebut);
        result = result.filter(f => new Date(f.dateEmission) >= dateDebut);
      }
      if (filters.dateFin) {
        const dateFin = new Date(filters.dateFin);
        result = result.filter(f => new Date(f.dateEmission) <= dateFin);
      }
      if (filters.client) {
        result = result.filter(f =>
          f.client.id === filters.client ||
          f.client.nom.toLowerCase().includes(filters.client!.toLowerCase()) ||
          f.client.prenom.toLowerCase().includes(filters.client!.toLowerCase())
        );
      }
      if (filters.montantMin) {
        result = result.filter(f => f.montantTTC >= Number(filters.montantMin!));
      }
      if (filters.montantMax) {
        result = result.filter(f => f.montantTTC <= Number(filters.montantMax!));
      }
      if (filters.recherche) {
        const search = filters.recherche.toLowerCase();
        result = result.filter(f =>
          f.numeroFacture.toLowerCase().includes(search) ||
          f.client.nom.toLowerCase().includes(search) ||
          f.client.prenom.toLowerCase().includes(search) ||
          f.vehicule.immatriculation.toLowerCase().includes(search) ||
          f.vehicule.marque.toLowerCase().includes(search) ||
          f.vehicule.modele.toLowerCase().includes(search)
        );
      }
    }

    return of(result).pipe(delay(500));
  }

  getFacture(id: string): Observable<Facture> {
    const facture = this.mockFactures.find(f => f.id === id);
    if (facture) {
      return of(facture).pipe(delay(300));
    }
    return throwError(() => new Error('Facture non trouvée'));
  }

  generateFromReparation(reparationId: string): Observable<Facture> {
    const mockFacture: Facture = {
      id: 'F' + Date.now(),
      numeroFacture: 'FACT-' + Math.floor(Math.random() * 10000),
      dateEmission: new Date(),
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
      client: { id: 'C123', nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@example.com', telephone: '0612345678', adresse: '123 Rue de Paris, 75001 Paris' },
      vehicule: { id: 'V456', marque: 'Peugeot', modele: '308', immatriculation: 'AB-123-CD', annee: 2018, kilometrage: 78000 },
      reparationId: reparationId,
      devisId: 'D789',
      lignesFacture: [
        { id: 'L1', designation: 'Remplacement filtre à huile', quantite: 1, prixUnitaireHT: 15.0, tauxTVA: 20, montantHT: 15.0, montantTVA: 3.0, montantTTC: 18.0, type: 'piece', reference: 'FH-308-2018' },
        { id: 'L2', designation: 'Huile moteur 5W30', quantite: 5, prixUnitaireHT: 8.0, tauxTVA: 20, montantHT: 40.0, montantTVA: 8.0, montantTTC: 48.0, type: 'piece', reference: 'HM-5W30' },
        { id: 'L3', designation: 'Main d\'œuvre vidange', quantite: 1, prixUnitaireHT: 45.0, tauxTVA: 20, montantHT: 45.0, montantTVA: 9.0, montantTTC: 54.0, type: 'main_oeuvre' }
      ],
      montantHT: 100.0,
      montantTVA: 20.0,
      montantTTC: 120.0,
      statut: 'brouillon',
      transactions: [],
      delaiPaiement: 30,
      creePar: 'M1'
    };
    this.mockFactures.push(mockFacture);
    return of(mockFacture).pipe(delay(800));
  }

  validateFacture(factureId: string): Observable<Facture> {
    const factureIndex = this.mockFactures.findIndex(f => f.id === factureId);
    if (factureIndex === -1) {
      return throwError(() => new Error('Facture non trouvée'));
    }
    this.mockFactures[factureIndex] = { ...this.mockFactures[factureIndex], statut: 'validee', validePar: 'MG1' };
    return of(this.mockFactures[factureIndex]).pipe(delay(500));
  }

  emitFacture(factureId: string): Observable<Facture> {
    const factureIndex = this.mockFactures.findIndex(f => f.id === factureId);
    if (factureIndex === -1) {
      return throwError(() => new Error('Facture non trouvée'));
    }
    if (this.mockFactures[factureIndex].statut !== 'validee') {
      return throwError(() => new Error('La facture doit être validée avant d\'être émise'));
    }
    this.mockFactures[factureIndex] = { ...this.mockFactures[factureIndex], statut: 'emise' };
    return of(this.mockFactures[factureIndex]).pipe(delay(500));
  }

  payFacture(factureId: string, paymentInfo: PaymentInfo): Observable<Transaction> {
    const factureIndex = this.mockFactures.findIndex(f => f.id === factureId);
    if (factureIndex === -1) {
      return throwError(() => new Error('Facture non trouvée'));
    }
    const transaction: Transaction = {
      id: 'T' + Date.now(),
      date: new Date(),
      montant: paymentInfo.montant,
      modePaiement: paymentInfo.modePaiement,
      reference: paymentInfo.reference,
      statut: 'validee'
    };
    this.mockFactures[factureIndex].transactions.push(transaction);
    const totalPaye = this.mockFactures[factureIndex].transactions
      .filter(t => t.statut === 'validee')
      .reduce((sum, t) => sum + t.montant, 0);
    if (totalPaye >= this.mockFactures[factureIndex].montantTTC) {
      this.mockFactures[factureIndex].statut = 'payee';
    } else if (totalPaye > 0) {
      this.mockFactures[factureIndex].statut = 'partiellement_payee';
    }
    return of(transaction).pipe(delay(800));
  }

  cancelFacture(factureId: string, reason: string): Observable<Facture> {
    const factureIndex = this.mockFactures.findIndex(f => f.id === factureId);
    if (factureIndex === -1) {
      return throwError(() => new Error('Facture non trouvée'));
    }
    this.mockFactures[factureIndex] = {
      ...this.mockFactures[factureIndex],
      statut: 'annulee',
      commentaires: (this.mockFactures[factureIndex].commentaires || '') + '\nAnnulation: ' + reason
    };
    return of(this.mockFactures[factureIndex]).pipe(delay(500));
  }

  getStats(): Observable<FactureStats> {
    const totalFactures = this.mockFactures.length;
    const totalMontant = this.mockFactures.reduce((sum, f) => sum + f.montantTTC, 0);
    const nombrePayees = this.mockFactures.filter(f => f.statut === 'payee').length;
    const nombreEnRetard = this.mockFactures.filter(f => f.statut === 'en_retard' || (f.statut !== 'payee' && f.statut !== 'annulee' && new Date() > new Date(f.dateEcheance))).length;
    let tempsMoyenPaiement = 0;
    const facturesPayees = this.mockFactures.filter(f => f.statut === 'payee');
    if (facturesPayees.length > 0) {
      const totalJours = facturesPayees.reduce((sum, f) => {
        const dernierPaiement = f.transactions.filter(t => t.statut === 'validee').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        return sum + Math.floor((new Date(dernierPaiement.date).getTime() - new Date(f.dateEmission).getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      tempsMoyenPaiement = totalJours / facturesPayees.length;
    }
    return of({ totalFactures, totalMontant, nombrePayees, nombreEnRetard, tempsMoyenPaiement }).pipe(delay(700));
  }

  // Mettre à jour une facture existante (principalement pour l'édition en mode brouillon)
  updateFacture(updatedFacture: Facture): Observable<Facture> {
    const factureIndex = this.mockFactures.findIndex(f => f.id === updatedFacture.id);
    if (factureIndex === -1) {
      return throwError(() => new Error('Facture non trouvée pour mise à jour'));
    }
    // Remplacer l'ancienne facture par la nouvelle dans notre tableau mocké
    this.mockFactures[factureIndex] = updatedFacture;
    console.log("Facture mise à jour dans le service:", updatedFacture);
    return of(updatedFacture).pipe(delay(400)); // Simuler délai réseau
  }

  private initMockData() {
    this.mockFactures = [
      // Facture payée
      {
        id: 'F001',
        numeroFacture: 'FACT-2024-001',
        dateEmission: new Date('2024-06-15'),
        dateEcheance: new Date('2024-07-15'),
        client: { id: 'C001', nom: 'Martin', prenom: 'Sophie', email: 'sophie.martin@example.com', telephone: '0612345678' },
        vehicule: { id: 'V001', marque: 'Renault', modele: 'Clio', immatriculation: 'AA-123-BB', annee: 2019, kilometrage: 45000 },
        reparationId: 'R001', devisId: 'D001',
        lignesFacture: [
          { id: 'L001', designation: 'Plaquettes de frein avant', quantite: 1, prixUnitaireHT: 60.0, tauxTVA: 20, montantHT: 60.0, montantTVA: 12.0, montantTTC: 72.0, type: 'piece', reference: 'PF-CLIO-2019' },
          { id: 'L002', designation: 'Pose plaquettes de frein', quantite: 1, prixUnitaireHT: 40.0, tauxTVA: 20, montantHT: 40.0, montantTVA: 8.0, montantTTC: 48.0, type: 'main_oeuvre' }
        ],
        montantHT: 100.0, montantTVA: 20.0, montantTTC: 120.0,
        statut: 'payee',
        transactions: [
          { id: 'T001', date: new Date('2024-06-20'), montant: 120.0, modePaiement: 'carte', reference: 'CB-20240620-001', statut: 'validee' }
        ],
        delaiPaiement: 30, creePar: 'M001', validePar: 'MG001'
      },
      // Facture émise (à payer)
      {
        id: 'F002',
        numeroFacture: 'FACT-2024-002',
        dateEmission: new Date('2024-09-05'),
        dateEcheance: new Date('2024-10-05'),
        client: { id: 'C002', nom: 'Dubois', prenom: 'Pierre', email: 'pierre.dubois@example.com', telephone: '0698765432' },
        vehicule: { id: 'V002', marque: 'Peugeot', modele: '3008', immatriculation: 'XY-789-ZT', annee: 2020, kilometrage: 32000 },
        reparationId: 'R002', devisId: 'D002',
        lignesFacture: [
          { id: 'L003', designation: 'Vidange moteur + filtre', quantite: 1, prixUnitaireHT: 50.0, tauxTVA: 20, montantHT: 50.0, montantTVA: 10.0, montantTTC: 60.0, type: 'main_oeuvre' },
          { id: 'L004', designation: 'Huile 5W30', quantite: 5, prixUnitaireHT: 12.0, tauxTVA: 20, montantHT: 60.0, montantTVA: 12.0, montantTTC: 72.0, type: 'piece', reference: 'HM-5W30-5L' },
          { id: 'L005', designation: 'Filtre à huile', quantite: 1, prixUnitaireHT: 15.0, tauxTVA: 20, montantHT: 15.0, montantTVA: 3.0, montantTTC: 18.0, type: 'piece', reference: 'FH-3008-2020' }
        ],
        montantHT: 125.0, montantTVA: 25.0, montantTTC: 150.0,
        statut: 'emise',
        transactions: [],
        delaiPaiement: 30, creePar: 'M002', validePar: 'MG001'
      },
      // Facture en brouillon
      {
        id: 'F003',
        numeroFacture: 'FACT-2024-003',
        dateEmission: new Date('2024-10-10'),
        dateEcheance: new Date('2024-11-10'),
        client: { id: 'C003', nom: 'Leroy', prenom: 'Marie', email: 'marie.leroy@example.com', telephone: '0678901234' },
        vehicule: { id: 'V003', marque: 'Citroën', modele: 'C3', immatriculation: 'CD-456-EF', annee: 2017, kilometrage: 68000 },
        reparationId: 'R003', devisId: 'D003',
        lignesFacture: [
          { id: 'L006', designation: 'Batterie 60Ah', quantite: 1, prixUnitaireHT: 80.0, tauxTVA: 20, montantHT: 80.0, montantTVA: 16.0, montantTTC: 96.0, type: 'piece', reference: 'BAT-60AH' },
          { id: 'L007', designation: 'Remplacement batterie', quantite: 1, prixUnitaireHT: 30.0, tauxTVA: 20, montantHT: 30.0, montantTVA: 6.0, montantTTC: 36.0, type: 'main_oeuvre' }
        ],
        montantHT: 110.0, montantTVA: 22.0, montantTTC: 132.0,
        statut: 'brouillon',
        transactions: [],
        delaiPaiement: 30, creePar: 'M001'
      },
      // Facture partiellement payée
      {
        id: 'F004',
        numeroFacture: 'FACT-2024-004',
        dateEmission: new Date('2024-08-20'),
        dateEcheance: new Date('2024-09-20'),
        client: { id: 'C001', nom: 'Martin', prenom: 'Sophie', email: 'sophie.martin@example.com', telephone: '0612345678' },
        vehicule: { id: 'V001', marque: 'Renault', modele: 'Clio', immatriculation: 'AA-123-BB', annee: 2019, kilometrage: 55000 },
        reparationId: 'R004', devisId: 'D004',
        lignesFacture: [
          { id: 'L008', designation: 'Pneu été Michelin Primacy 4', quantite: 2, prixUnitaireHT: 75.0, tauxTVA: 20, montantHT: 150.0, montantTVA: 30.0, montantTTC: 180.0, type: 'piece', reference: 'PN-MI-P4' },
          { id: 'L009', designation: 'Montage/équilibrage pneu', quantite: 2, prixUnitaireHT: 20.0, tauxTVA: 20, montantHT: 40.0, montantTVA: 8.0, montantTTC: 48.0, type: 'main_oeuvre' }
        ],
        montantHT: 190.0, montantTVA: 38.0, montantTTC: 228.0,
        statut: 'partiellement_payee',
        transactions: [
          { id: 'T002', date: new Date('2024-08-25'), montant: 100.0, modePaiement: 'especes', statut: 'validee' }
        ],
        delaiPaiement: 30, creePar: 'M002', validePar: 'MG001'
      },
      // Facture validée (prête à être émise)
      {
        id: 'F005',
        numeroFacture: 'FACT-2024-005',
        dateEmission: new Date('2024-10-01'),
        dateEcheance: new Date('2024-10-31'),
        client: { id: 'C004', nom: 'Petit', prenom: 'Lucas', email: 'lucas.petit@example.com', telephone: '0655443322' },
        vehicule: { id: 'V004', marque: 'Volkswagen', modele: 'Golf', immatriculation: 'EF-987-GH', annee: 2016, kilometrage: 95000 },
        reparationId: 'R005', devisId: 'D005',
        lignesFacture: [
          { id: 'L010', designation: 'Kit distribution + pompe à eau', quantite: 1, prixUnitaireHT: 250.0, tauxTVA: 20, montantHT: 250.0, montantTVA: 50.0, montantTTC: 300.0, type: 'piece', reference: 'KD-VW-GOLF' },
          { id: 'L011', designation: 'Remplacement kit distribution', quantite: 4, prixUnitaireHT: 55.0, tauxTVA: 20, montantHT: 220.0, montantTVA: 44.0, montantTTC: 264.0, type: 'main_oeuvre' }
        ],
        montantHT: 470.0, montantTVA: 94.0, montantTTC: 564.0,
        statut: 'validee',
        transactions: [],
        delaiPaiement: 30, creePar: 'M001', validePar: 'MG001'
      },
      // Facture en retard
      {
        id: 'F006',
        numeroFacture: 'FACT-2024-006',
        dateEmission: new Date('2024-05-01'),
        dateEcheance: new Date('2024-06-01'), // Échue
        client: { id: 'C002', nom: 'Dubois', prenom: 'Pierre', email: 'pierre.dubois@example.com', telephone: '0698765432' },
        vehicule: { id: 'V002', marque: 'Peugeot', modele: '3008', immatriculation: 'XY-789-ZT', annee: 2020, kilometrage: 41000 },
        reparationId: 'R006', devisId: 'D006',
        lignesFacture: [
          { id: 'L012', designation: 'Contrôle technique', quantite: 1, prixUnitaireHT: 70.0, tauxTVA: 20, montantHT: 70.0, montantTVA: 14.0, montantTTC: 84.0, type: 'main_oeuvre' }
        ],
        montantHT: 70.0, montantTVA: 14.0, montantTTC: 84.0,
        statut: 'emise', // Sera marqué comme 'en_retard' par le composant si la date est dépassée
        transactions: [],
        delaiPaiement: 30, creePar: 'M002', validePar: 'MG001'
      }
    ];
  }
} 