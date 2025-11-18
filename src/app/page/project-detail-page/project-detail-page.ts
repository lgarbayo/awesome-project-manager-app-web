import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { ProjectService } from '../../service/project-service';
import { Project, UpsertProjectCommand } from '../../model/project.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { JsonPipe } from '@angular/common';
import { TaskGantt } from "../../component/project/task-gantt/task-gantt";
import { ProjectForm } from "../../component/project/project-form/project-form";

@Component({
  selector: 'app-project-detail-page',
  imports: [
    JsonPipe, // TODO testing only
    TaskGantt,
    ProjectForm
],
  templateUrl: './project-detail-page.html',
  styleUrl: './project-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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

  color = signal<'black' | 'red' | 'orange'>('black');

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

  toggle(): void {
    const value = this.color();
    if (value === 'black') {
      this.color.set('orange');
    } else if (value === 'orange') {
      this.color.set('red');
    } else {
      this.color.set('black');
    }
  }

  processTaskEvent(event: "add-task" | "remove-task" ): void {
    console.log('evento desde hijo', event);
  }

  update(data: UpsertProjectCommand): void {
    alert('Vamos a cambiar el titulo a ' + data.title);
  }

}
