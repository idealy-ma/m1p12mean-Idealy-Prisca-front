import { Component, OnInit } from '@angular/core';
import { SuccessService, SuccessState } from '../../services/success/success.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-success-message',
  templateUrl: './success-message.component.html',
  styleUrls: ['./success-message.component.css']
})
export class SuccessMessageComponent implements OnInit {
  successState$: Observable<SuccessState>;

  constructor(private successService: SuccessService) {
    this.successState$ = this.successService.getSuccessState();
  }

  ngOnInit(): void {
  }

  hideSuccess(): void {
    this.successService.hideSuccess();
  }
} 