import { Component, OnInit } from '@angular/core';
import { ConfirmationService, ConfirmationState } from '../../services/confirmation/confirmation.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent implements OnInit {
  confirmationState$: Observable<ConfirmationState>;

  constructor(private confirmationService: ConfirmationService) {
    this.confirmationState$ = this.confirmationService.getConfirmationState();
  }

  ngOnInit(): void {
  }

  confirm(): void {
    this.confirmationService.confirmDialog();
  }

  cancel(): void {
    this.confirmationService.cancelDialog();
  }
} 