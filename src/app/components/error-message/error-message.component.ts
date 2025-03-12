import { Component, OnInit } from '@angular/core';
import { ErrorService, ErrorState } from '../../services/error/error.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.css']
})
export class ErrorMessageComponent implements OnInit {
  errorState$: Observable<ErrorState>;

  constructor(private errorService: ErrorService) {
    this.errorState$ = this.errorService.getErrorState();
  }

  ngOnInit(): void {
  }

  hideError(): void {
    this.errorService.hideError();
  }
} 