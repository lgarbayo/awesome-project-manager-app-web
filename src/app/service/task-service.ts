import { inject, Injectable } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Task, TaskDescriptionResponse, TaskEstimate, UpsertTaskCommand, UpsertTaskCommandForm } from '../model/task.model';
import { CoreService } from './core-service';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly projectUrl = '/api/project';
  private http = inject(HttpClient);
  private nfb = inject(NonNullableFormBuilder);
  private coreService = inject(CoreService);

  list(projectUuid: string): Observable<Array<Task>> {
    return this.http.get<Array<Task>>(`${this.projectUrl}/${projectUuid}/task`);
  }

  get(projectUuid: string, taskUuid: string): Observable<Task> {
    return this.http.get<Task>(`${this.projectUrl}/${projectUuid}/task/${taskUuid}`);
  }

  create(projectUuid: string, command: UpsertTaskCommand): Observable<Task> {
    return this.http.post<Task>(`${this.projectUrl}/${projectUuid}/task`, command);
  }

  update(projectUuid: string, taskUuid: string, command: UpsertTaskCommand): Observable<Task> {
    return this.http.put<Task>(`${this.projectUrl}/${projectUuid}/task/${taskUuid}`, command);
  }

  delete(projectUuid: string, taskUuid: string): Observable<void> {
    return this.http.delete<void>(`${this.projectUrl}/${projectUuid}/task/${taskUuid}`);
  }

  estimate(projectUuid: string, taskUuid: string): Observable<TaskEstimate> {
    return this.http.post<TaskEstimate>(`${this.projectUrl}/${projectUuid}/task/${taskUuid}/estimate`, {});
  }

  describe(projectUuid: string, taskUuid: string, prompt?: string): Observable<TaskDescriptionResponse> {
    const body = prompt?.trim() ? { prompt: prompt.trim() } : {};
    return this.http.post<TaskDescriptionResponse>(`${this.projectUrl}/${projectUuid}/task/${taskUuid}/description`, body);
  }

  taskForm(task?: Task): UpsertTaskCommandForm {
    return this.nfb.group({
      title: [task?.title ?? '', [Validators.required]],
      description: task?.description ?? '',
      durationWeeks: [task?.durationWeeks ?? 1, [Validators.required]],
      startDate: this.coreService.dateTypeForm(task?.startDate),
    });
  }
}
