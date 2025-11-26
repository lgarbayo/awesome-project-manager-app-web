import { inject, Injectable } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
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
    return this.nfb.group({
      year: data?.year ?? today.getFullYear(),
      month: data?.month ?? today.getMonth(),
      week: data?.week ?? Math.floor(today.getDate() / 8)
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

  toDisplayMonth(value?: number | null): number {
    return (value ?? 0) + 1;
  }

  toDisplayWeek(value?: number | null): number {
    return (value ?? 0) + 1;
  }

  toBackendMonth(displayValue: number): number {
    return Math.max(displayValue - 1, 0);
  }

  toBackendWeek(displayValue: number): number {
    return Math.max(displayValue - 1, 0);
  }

}
