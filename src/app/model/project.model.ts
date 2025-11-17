import { FormControl, FormGroup, FormRecord } from "@angular/forms";
import { DateType, DateTypeForm } from "./core.model";


export interface Project {
    uuid: string;
    title: string;
    description: string;
    startDate: DateType;
    endDate: DateType;
    additionalFields: Record<string, string>;
}

// Note: this can be used as parent for Project interface, but
// commands should be used as independent operations.
export interface UpsertProjectCommand {
    title: string;
    description: string;
    startDate: DateType;
    endDate: DateType;
    additionalFields: Record<string, string>;
}

export type UpsertProjectCommandForm = FormGroup<{
    title: FormControl<string>;
    description: FormControl<string>;
    startDate: DateTypeForm;
    endDate: DateTypeForm;
    additionalFields: FormRecord<FormControl<string>>;
}>;