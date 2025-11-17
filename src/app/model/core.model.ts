import { FormControl, FormGroup } from "@angular/forms";

export interface DateType {
    year: number;
    month: number;
    week: number;
}

export type DateTypeForm = FormGroup<{
    year: FormControl<number>;
    month: FormControl<number>;
    week: FormControl<number>;
}>;