import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Task, UpsertTaskCommand } from '../../../model/task.model';
import { TaskService } from '../../../service/task-service';
import { CoreService } from '../../../service/core-service';

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
    const command: UpsertTaskCommand = {
      ...this.form.getRawValue(),
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

}
