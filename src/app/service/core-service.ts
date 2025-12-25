import { inject, Injectable } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { DateType, DateTypeForm } from '../model/core.model';

@Injectable({
  providedIn: 'root',
})
export class CoreService {
  private nfb = inject(NonNullableFormBuilder);
  readonly monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  dateTypeForm(data?: DateType): DateTypeForm {
    const today = new Date();
    const currentYear = today.getFullYear();
    const minYear = Math.min(currentYear, data?.year ?? currentYear);
    const maxYear = Math.max(currentYear + 5, data?.year ?? currentYear + 5); // allow future dates up to 5 years ahead
    const initialYear = data?.year ?? currentYear;
    return this.nfb.group({
      year: [initialYear, [Validators.min(minYear), Validators.max(maxYear)]],
      month: [data?.month ?? today.getMonth(), [Validators.min(0), Validators.max(11)]],
      week: [data?.week ?? Math.floor(today.getDate() / 8), [Validators.min(0), Validators.max(3)]]
    });
  }

  // date helper

  formatDateLabel(date?: DateType | null): string {
    if (!date) {
      return '';
    }
    const monthIndex = typeof date.month === 'number' ? date.month : 0;
    const month = this.monthNames[monthIndex] ?? `Month ${monthIndex + 1}`;
    const week = this.toDisplayWeek(date.week);
    return `${month} ${date.year} · Week ${week}`;
  }

  toDisplayWeek(value?: number | null): number {
    return (value ?? 0) + 1;
  }

}
