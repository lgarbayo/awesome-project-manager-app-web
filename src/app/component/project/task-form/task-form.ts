import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Task, UpsertTaskCommand } from '../../../model/task.model';
import { TaskService } from '../../../service/task-service';
import { CoreService } from '../../../service/core-service';
import { DateType } from '../../../model/core.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './task-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskForm {
  private taskService = inject(TaskService);
  protected core = inject(CoreService);

  form = this.taskService.taskForm();
  data = input<Task | null | undefined>();
  submitted = output<UpsertTaskCommand>();
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
    const command: UpsertTaskCommand = {
      ...raw,
      startDate: this.normalizeDate(raw.startDate),
    };
    this.submitted.emit(command);
  }

  resetForm(): void {
    this.resetFormState(this.data() ?? undefined);
  }

  cancelEdit(): void {
    this.cancelled.emit();
  }

  private resetFormState(task?: Task): void {
    this.form = this.taskService.taskForm(task);
  }

  private normalizeDate(date: DateType): DateType {
    return {
      ...date,
      month: this.core.toBackendMonth(date.month),
      week: this.core.toBackendWeek(date.week),
    };
  }
}
