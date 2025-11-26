import { inject, Injectable } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Milestone, UpsertMilestoneCommand, UpsertMilestoneCommandForm } from '../model/milestone.model';
import { CoreService } from './core-service';

@Injectable({
  providedIn: 'root',
})
export class MilestoneService {
  private readonly projectUrl = '/project';
  private http = inject(HttpClient);
  private nfb = inject(NonNullableFormBuilder);
  private coreService = inject(CoreService);

  list(projectUuid: string): Observable<Array<Milestone>> {
    return this.http.get<Array<Milestone>>(`${this.projectUrl}/${projectUuid}/milestone`);
  }

  get(projectUuid: string, milestoneUuid: string): Observable<Milestone> {
    return this.http.get<Milestone>(`${this.projectUrl}/${projectUuid}/milestone/${milestoneUuid}`);
  }

  create(projectUuid: string, command: UpsertMilestoneCommand): Observable<Milestone> {
    return this.http.post<Milestone>(`${this.projectUrl}/${projectUuid}/milestone`, command);
  }

  update(
    projectUuid: string,
    milestoneUuid: string,
    command: UpsertMilestoneCommand
  ): Observable<Milestone> {
    return this.http.put<Milestone>(
      `${this.projectUrl}/${projectUuid}/milestone/${milestoneUuid}`,
      command
    );
  }

  delete(projectUuid: string, milestoneUuid: string): Observable<void> {
    return this.http.delete<void>(`${this.projectUrl}/${projectUuid}/milestone/${milestoneUuid}`);
  }

  milestoneForm(milestone?: Milestone): UpsertMilestoneCommandForm {
    return this.nfb.group({
      title: [milestone?.title ?? '', [Validators.required]],
      description: milestone?.description ?? '',
      date: this.coreService.dateTypeForm(milestone?.date),
    });
  }
}
