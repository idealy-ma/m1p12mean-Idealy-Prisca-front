import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriqueReparationsComponent } from './historique-reparations.component';

describe('HistoriqueReparationsComponent', () => {
  let component: HistoriqueReparationsComponent;
  let fixture: ComponentFixture<HistoriqueReparationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HistoriqueReparationsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriqueReparationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
