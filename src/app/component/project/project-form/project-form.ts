import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { Project, UpsertProjectCommand } from '../../../model/project.model';
import { ProjectService } from '../../../service/project-service';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { CoreService } from '../../../service/core-service';
import { DateType } from '../../../model/core.model';

const trimmedRequired: ValidatorFn = (control) => {
  const value = (control.value ?? '') as string;
  return value.trim() ? null : { required: true };
};

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
    key: ['', [trimmedRequired]],
    value: ['', [trimmedRequired]],
  });

  data = input<Project>();
  edited = output<UpsertProjectCommand>();

  constructor() {
    effect(() => this.resetFormState(this.data()));
  }

  save(): void {
    // check blank spaces in title
    const title = this.form.controls.title;
    const rawTitle = title.value?.trim() ?? '';
    if (!rawTitle) {
      title.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // normalize dates and emit
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

    const valueControl = this.additionalFieldForm.controls.value;
    const value = valueControl.value.trim();
    if (!value) {
      valueControl.setErrors({ required: true });
      return;
    }

    if (this.form.controls.additionalFields.controls[key]) {
      this.additionalFieldForm.controls.key.setErrors({ duplicated: true });
      return;
    }

    this.form.controls.additionalFields.addControl(
      key,
      this.nfb.control(value)
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
