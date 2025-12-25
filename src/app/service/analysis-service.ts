import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProjectAnalysis } from '../model/analysis.model';

@Injectable({
  providedIn: 'root',
})
export class AnalysisService {
  private readonly projectUrl = '/api/project';
  private http = inject(HttpClient);

  getProjectAnalysis(projectUuid: string): Observable<ProjectAnalysis> {
    return this.http.get<ProjectAnalysis>(`${this.projectUrl}/${projectUuid}/analysis`);
  }

}
