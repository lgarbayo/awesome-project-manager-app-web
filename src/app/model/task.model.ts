import { FormControl, FormGroup, FormRecord } from "@angular/forms";
import { DateType, DateTypeForm } from "./core.model";

export interface Task {
  uuid: string;
  projectUuid: string;
  title: string;
  description?: string;
  durationWeeks: number;
  startDate: DateType;
}

export interface UpsertTaskCommand {
  title: string;
  description?: string;
  durationWeeks: number;
  startDate: DateType;
}

export type UpsertTaskCommandForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  durationWeeks: FormControl<number>;
  startDate: DateTypeForm;
}>;
