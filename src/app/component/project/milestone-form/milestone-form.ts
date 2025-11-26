import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Milestone, UpsertMilestoneCommand } from '../../../model/milestone.model';
import { MilestoneService } from '../../../service/milestone-service';
import { CoreService } from '../../../service/core-service';
import { DateType } from '../../../model/core.model';

@Component({
  selector: 'app-milestone-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './milestone-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MilestoneForm {
  private milestoneService = inject(MilestoneService);
  protected core = inject(CoreService);

  form = this.milestoneService.milestoneForm();
  data = input<Milestone | null | undefined>();
  submitted = output<UpsertMilestoneCommand>();
  cancelled = output<void>();

  protected readonly isEditing = computed(() => !!this.data());

  constructor() {
    effect(() => this.resetFormState(this.data() ?? undefined));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const command: UpsertMilestoneCommand = {
      ...raw,
      date: this.normalizeDate(raw.date),
    };
    this.submitted.emit(command);
  }

  resetForm(): void {
    this.resetFormState(this.data() ?? undefined);
  }

  cancelEdit(): void {
    this.cancelled.emit();
  }

  private resetFormState(milestone?: Milestone): void {
    this.form = this.milestoneService.milestoneForm(milestone);
  }

  private normalizeDate(date: DateType): DateType {
    return {
      ...date,
      month: this.core.toBackendMonth(date.month),
      week: this.core.toBackendWeek(date.week),
    };
  }
}
