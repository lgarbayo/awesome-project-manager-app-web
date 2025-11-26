import { FormControl, FormGroup } from '@angular/forms';
import { DateType, DateTypeForm } from './core.model';

export interface Milestone {
  uuid: string;
  projectUuid: string;
  title: string;
  date: DateType;
  description?: string;
}

export interface UpsertMilestoneCommand {
  title: string;
  date: DateType;
  description?: string;
}

export type UpsertMilestoneCommandForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  date: DateTypeForm;
}>;
