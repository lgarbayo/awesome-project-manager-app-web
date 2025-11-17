import { inject, Injectable } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { DateType, DateTypeForm } from '../model/core.model';

@Injectable({
  providedIn: 'root',
})
export class CoreService {
  private nfb = inject(NonNullableFormBuilder);

  dateTypeForm(data?: DateType): DateTypeForm {
    const today = new Date();
    return this.nfb.group({
      year: data?.year ?? today.getFullYear(),
      month: data?.month ?? today.getMonth(),
      week: data?.week ?? Math.floor(today.getDate() / 8)
    });
  }

}
