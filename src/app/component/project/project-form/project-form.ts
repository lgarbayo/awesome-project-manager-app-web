import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { Project, UpsertProjectCommand } from '../../../model/project.model';
import { ProjectService } from '../../../service/project-service';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoreService } from '../../../service/core-service';
import { DateType } from '../../../model/core.model';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './project-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectForm {
  private projectService = inject(ProjectService);
  private nfb = inject(NonNullableFormBuilder);
  protected core = inject(CoreService);

  form = this.projectService.projectForm();
  additionalFieldForm = this.nfb.group({
    key: ['', [Validators.required]],
    value: ['', [Validators.required]],
  });

  data = input<Project>();
  edited = output<UpsertProjectCommand>();

  constructor() {
    effect(() => this.resetFormState(this.data()));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const rawValue = this.form.getRawValue();
    const command: UpsertProjectCommand = {
      ...rawValue,
      startDate: this.normalizeDate(rawValue.startDate),
      endDate: this.normalizeDate(rawValue.endDate)
    };
    this.edited.emit(command);
  }

  addAdditionalField(): void {
    if (this.additionalFieldForm.invalid) {
      this.additionalFieldForm.markAllAsTouched();
      return;
    }

    const key = this.additionalFieldForm.controls.key.value.trim();
    if (!key) {
      this.additionalFieldForm.controls.key.setErrors({ required: true });
      return;
    }

    if (this.form.controls.additionalFields.controls[key]) {
      this.additionalFieldForm.controls.key.setErrors({ duplicated: true });
      return;
    }

    this.form.controls.additionalFields.addControl(
      key,
      this.nfb.control(this.additionalFieldForm.controls.value.value ?? '')
    );
    this.additionalFieldForm.reset();
  }

  removeAdditionalField(key: string): void {
    this.form.controls.additionalFields.removeControl(key);
  }

  additionalFieldList(): Array<{ key: string; control: FormControl<string> }> {
    return Object.entries(this.form.controls.additionalFields.controls).map(([key, control]) => ({
      key,
      control,
    }));
  }

  resetForm(): void {
    this.resetFormState(this.data());
  }

  private resetFormState(project?: Project): void {
    this.form = this.projectService.projectForm(project);
    this.additionalFieldForm.reset();
  }

  private normalizeDate(date: DateType): DateType {
    return {
      ...date,
      month: this.core.toBackendMonth(date.month),
      week: this.core.toBackendWeek(date.week),
    };
  }
}
