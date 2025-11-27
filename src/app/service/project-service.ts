import { inject, Injectable } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { Project, UpsertProjectCommand, UpsertProjectCommandForm } from '../model/project.model';
import { CoreService } from './core-service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

const trimmedRequired: ValidatorFn = control => {
  const value = (control.value ?? '') as string;
  return value.trim() ? null : { required: true };
};

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly resourceUrl = '/api/project';
  private nfb = inject(NonNullableFormBuilder);
  private coreService = inject(CoreService);
  private http = inject(HttpClient);

  list(): Observable<Array<Project>> {
    return this.http.get<Array<Project>>(this.resourceUrl);
  }

  get(projectUuid: string): Observable<Project> {
    return this.http.get<Project>(`${this.resourceUrl}/${projectUuid}`);
  }

  createProject(command: UpsertProjectCommand): Observable<Project> {
    return this.http.post<Project>(this.resourceUrl, command);
  }

  updateProject(projectUuid: string, command: UpsertProjectCommand): Observable<Project> {
    return this.http.put<Project>(`${this.resourceUrl}/${projectUuid}`, command);
  }

  deleteProject(projectUuid: string): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${projectUuid}`);
  }

  projectForm(project?: Project): UpsertProjectCommandForm {
    return this.nfb.group({
      title: [project?.title ?? '', [trimmedRequired]],
      description: project?.description ?? '',
      startDate: this.coreService.dateTypeForm(project?.startDate),
      endDate: this.coreService.dateTypeForm(project?.endDate),
      additionalFields: this.additionalFieldsForm(project?.additionalFields ?? {}),
    });
  }

  private additionalFieldsForm(additionalFields: Record<string, string>) {
    return this.nfb.record(
      Object.entries(additionalFields).reduce((acc, [key, value]) => {
        acc[key] = this.nfb.control(value ?? '');
        return acc;
      }, {} as { [key: string]: FormControl<string> })
    );
  }
}
