import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ProjectService } from '../../service/project-service';
import { Project, UpsertProjectCommand } from '../../model/project.model';
import { RouterLink } from '@angular/router';
import { ProjectForm } from "../../component/project/project-form/project-form";
import { CoreService } from '../../service/core-service';

@Component({
  selector: 'app-project-list-page',
  standalone: true,
  imports: [
    RouterLink,
    ProjectForm
],
  templateUrl: './project-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectListPage implements OnInit {
  private projectService = inject(ProjectService);
  protected core = inject(CoreService);

  projectList = signal<Array<Project>>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showCreateModal = signal(false);
  private lastUpdatedAt = signal<Date | null>(null);

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectService.list().subscribe({
      next: (projects) => {
        this.projectList.set(projects);
        this.errorMessage.set(null);
      },
      error: (error) => {
        console.error('Unable to fetch project list', error);
        this.errorMessage.set("We couldn't load the project list.");
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  createProject(command: UpsertProjectCommand): void {
    this.loading.set(true);
    this.projectService.createProject(command).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadProjects();
      },
      error: (error) => {
        console.error('Error creating project', error);
        this.errorMessage.set('We couldn\'t create the project.');
        this.loading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  deleteProject(projectUuid: string): void {
    this.loading.set(true);
    this.projectService.deleteProject(projectUuid).subscribe({
      next: () => this.loadProjects(),
      error: (error) => {
        console.error('Error deleting project', error);
        this.errorMessage.set('We couldn\'t delete the project.');
        this.loading.set(false);
      },
    });
  }

  // same as trackBy function in *ngFor:
  // is useful to tell Angular how to track items inn the list
  // each card should be tracked by its project.uuid, so Angular don't destroy and recreate DOM elements unnecessarily
  trackProject(_: number, project: Project): string {
    return project.uuid;
  }

  private toDateValue(date: Project['startDate'] | Project['endDate'] | undefined): number {
    if (!date || typeof date.year !== 'number') {
      return Number.POSITIVE_INFINITY;
    }
    const month = typeof date.month === 'number' ? date.month : 0;
    const week = typeof date.week === 'number' ? date.week : 0;
    return new Date(date.year, month, 1 + week * 7).getTime();
  }
}
