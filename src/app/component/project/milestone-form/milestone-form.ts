import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Milestone, UpsertMilestoneCommand } from '../../../model/milestone.model';
import { MilestoneService } from '../../../service/milestone-service';
import { CoreService } from '../../../service/core-service';

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
    const command: UpsertMilestoneCommand = {
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

  private resetFormState(milestone?: Milestone): void {
    this.form = this.milestoneService.milestoneForm(milestone);
  }

}
