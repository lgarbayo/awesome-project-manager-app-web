import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { ProjectService } from '../../service/project-service';
import { Project } from '../../service/project';
import { toSignal } from '@angular/core/rxjs-interop';
import { JsonPipe } from '@angular/common';
import { TaskGantt } from "../../component/project/task-gantt/task-gantt";

@Component({
  selector: 'app-project-detail-page',
  imports: [
    JsonPipe, // TODO testing only
    TaskGantt
],
  templateUrl: './project-detail-page.html',
  styleUrl: './project-detail-page.scss',
})
export class ProjectDetailPage {
  private activatedRoute = inject(ActivatedRoute);
  private projectService = inject(ProjectService);

  private projectUuid = toSignal(
    this.activatedRoute.paramMap.pipe(
      map(p => p.get('projectUuid'))
    )
  );

  project = signal<Project | undefined>(undefined);

  constructor() {
    effect(() => {
      const projectUuid = this.projectUuid();
      if (projectUuid) {
        this.projectService.get(projectUuid).subscribe({
          next: p => this.project.set(p),
          error: e => {
            console.log('Unable to load project');
            this.project.set(undefined);
            // TODO what to do in this situation?
          }
        });
      }
    });
  }

}
