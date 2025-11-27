import { ChangeDetectionStrategy, Component, effect, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { ProjectService } from '../../service/project-service';
import { Project, UpsertProjectCommand } from '../../model/project.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { Milestone, UpsertMilestoneCommand } from '../../model/milestone.model';
import { Task, UpsertTaskCommand } from '../../model/task.model';
import { MilestoneService } from '../../service/milestone-service';
import { TaskService } from '../../service/task-service';
import { AnalysisService } from '../../service/analysis-service';
import { ProjectAnalysis } from '../../model/analysis.model';
import { ProjectForm } from '../../component/project/project-form/project-form';
import { MilestoneForm } from '../../component/project/milestone-form/milestone-form';
import { TaskForm } from '../../component/project/task-form/task-form';
import { CoreService } from '../../service/core-service';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [
    DecimalPipe,
    ProjectForm,
    MilestoneForm,
    TaskForm
  ],
  templateUrl: './project-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailPage {
  private activatedRoute = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private milestoneService = inject(MilestoneService);
  private taskService = inject(TaskService);
  private analysisService = inject(AnalysisService);
  protected core = inject(CoreService);

  @ViewChild('milestoneCreator') milestoneForm?: MilestoneForm;
  @ViewChild('taskCreator') taskForm?: TaskForm;

  private projectUuid = toSignal(
    this.activatedRoute.paramMap.pipe(
      map((p) => p.get('projectUuid'))
    )
  );

  project = signal<Project | undefined>(undefined);
  milestones = signal<Array<Milestone>>([]);
  tasks = signal<Array<Task>>([]);
  analysis = signal<ProjectAnalysis | undefined>(undefined);

  selectedMilestone = signal<Milestone | null>(null);
  selectedTask = signal<Task | null>(null);

  projectLoading = signal(false);
  projectError = signal<string | null>(null);
  milestoneLoading = signal(false);
  milestoneError = signal<string | null>(null);
  taskLoading = signal(false);
  taskError = signal<string | null>(null);
  analysisLoading = signal(false);
  analysisError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const projectUuid = this.projectUuid();
      if (projectUuid) {
        this.loadProject(projectUuid);
        this.loadMilestones(projectUuid);
        this.loadTasks(projectUuid);
        this.loadAnalysis(projectUuid);
        this.selectedMilestone.set(null);
        this.selectedTask.set(null);
      }
    });
  }

  update(data: UpsertProjectCommand): void {
    const projectUuid = this.projectUuid();
    if (!projectUuid) return;
    this.projectService.updateProject(projectUuid, data).subscribe({
      next: (updated) => {
        this.project.set(updated);
        this.projectError.set(null);
      },
      error: (error) => {
        console.error('Error updating project', error);
        this.projectError.set("Couldn't update the project.");
      },
    });
  }

  saveMilestone(command: UpsertMilestoneCommand): void {
    const projectUuid = this.projectUuid();
    if (!projectUuid) {
      return;
    }
    this.milestoneLoading.set(true);
    const editing = this.selectedMilestone();
    const request$ = editing
      ? this.milestoneService.update(projectUuid, editing.uuid, command)
      : this.milestoneService.create(projectUuid, command);

    request$.subscribe({
      next: () => {
        this.milestoneForm?.resetForm();
        this.selectedMilestone.set(null);
        this.loadMilestones(projectUuid);
        this.loadAnalysis(projectUuid);
      },
      error: (error) => {
        console.error('Error saving milestone', error);
        this.milestoneError.set("Couldn't save the milestone.");
        this.milestoneLoading.set(false);
      },
    });
  }

  removeMilestone(milestoneUuid: string): void {
    const projectUuid = this.projectUuid();
    if (!projectUuid) {
      return;
    }
    this.milestoneLoading.set(true);
    this.milestoneService.delete(projectUuid, milestoneUuid).subscribe({
      next: () => {
        if (this.selectedMilestone()?.uuid === milestoneUuid) {
          this.selectedMilestone.set(null);
          this.milestoneForm?.resetForm();
        }
        this.loadMilestones(projectUuid);
        this.loadAnalysis(projectUuid);
      },
      error: (error) => {
        console.error('Error deleting milestone', error);
        this.milestoneError.set("Couldn't delete the milestone.");
        this.milestoneLoading.set(false);
      },
    });
  }

  editMilestone(milestone: Milestone): void {
    this.selectedMilestone.set(milestone);
  }

  cancelMilestoneEdition(): void {
    this.selectedMilestone.set(null);
    this.milestoneForm?.resetForm();
  }

  saveTask(command: UpsertTaskCommand): void {
    const projectUuid = this.projectUuid();
    if (!projectUuid) {
      return;
    }
    this.taskLoading.set(true);
    const editing = this.selectedTask();
    const request$ = editing
      ? this.taskService.update(projectUuid, editing.uuid, command)
      : this.taskService.create(projectUuid, command);

    request$.subscribe({
      next: () => {
        this.taskForm?.resetForm();
        this.selectedTask.set(null);
        this.loadTasks(projectUuid);
        this.loadAnalysis(projectUuid);
      },
      error: (error) => {
        console.error('Error saving task', error);
        this.taskError.set("Couldn't save the task.");
        this.taskLoading.set(false);
      },
    });
  }

  removeTask(taskUuid: string): void {
    const projectUuid = this.projectUuid();
    if (!projectUuid) {
      return;
    }
    this.taskLoading.set(true);
    this.taskService.delete(projectUuid, taskUuid).subscribe({
      next: () => {
        if (this.selectedTask()?.uuid === taskUuid) {
          this.selectedTask.set(null);
          this.taskForm?.resetForm();
        }
        this.loadTasks(projectUuid);
        this.loadAnalysis(projectUuid);
      },
      error: (error) => {
        console.error('Error deleting task', error);
        this.taskError.set("Couldn't delete the task.");
        this.taskLoading.set(false);
      },
    });
  }

  editTask(task: Task): void {
    this.selectedTask.set(task);
  }

  cancelTaskEdition(): void {
    this.selectedTask.set(null);
    this.taskForm?.resetForm();
  }

  refreshAnalysis(): void {
    const projectUuid = this.projectUuid();
    if (projectUuid) {
      this.loadAnalysis(projectUuid);
    }
  }

  refreshMilestones(): void {
    const projectUuid = this.projectUuid();
    if (projectUuid) {
      this.loadMilestones(projectUuid);
    }
  }

  refreshTasks(): void {
    const projectUuid = this.projectUuid();
    if (projectUuid) {
      this.loadTasks(projectUuid);
    }
  }

  // same as trackBy function in *ngFor:
  // is useful to tell Angular how to track items inn the list
  // each card should be tracked by its project.uuid, so Angular don't destroy and recreate DOM elements unnecessarily
  trackMilestone(_: number, milestone: Milestone): string {
    return milestone.uuid;
  }

  // same as trackBy function in *ngFor:
  // is useful to tell Angular how to track items inn the list
  // each card should be tracked by its project.uuid, so Angular don't destroy and recreate DOM elements unnecessarily
  trackTask(_: number, task: Task): string {
    return task.uuid;
  }

  private loadProject(projectUuid: string): void {
    this.projectLoading.set(true);
    this.projectService.get(projectUuid).subscribe({
      next: (project) => {
        this.project.set(project);
        this.projectError.set(null);
      },
      error: (error) => {
        console.error('Unable to load project', error);
        this.project.set(undefined);
        this.projectError.set("Couldn't load the project.");
      },
      complete: () => this.projectLoading.set(false),
    });
  }

  private loadMilestones(projectUuid: string): void {
    this.milestoneLoading.set(true);
    this.milestoneService.list(projectUuid).subscribe({
      next: (milestones) => {
        this.milestones.set(milestones);
        this.milestoneError.set(null);
      },
      error: (error) => {
        console.error('Unable to load milestones', error);
        this.milestones.set([]);
        this.milestoneError.set("Couldn't load the milestones.");
        this.milestoneLoading.set(false);
      },
      complete: () => this.milestoneLoading.set(false),
    });
  }

  private loadTasks(projectUuid: string): void {
    this.taskLoading.set(true);
    this.taskService.list(projectUuid).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.taskError.set(null);
      },
      error: (error) => {
        console.error('Unable to load tasks', error);
        this.tasks.set([]);
        this.taskError.set("Couldn't load the tasks.");
        this.taskLoading.set(false);
      },
      complete: () => this.taskLoading.set(false),
    });
  }

  private loadAnalysis(projectUuid: string): void {
    this.analysisLoading.set(true);
    this.analysisService.getProjectAnalysis(projectUuid).subscribe({
      next: (analysis) => {
        this.analysis.set(analysis);
        this.analysisError.set(null);
      },
      error: (error) => {
        console.error('Unable to load project analysis', error);
        this.analysis.set(undefined);
        this.analysisError.set("Couldn't load the analysis.");
        this.analysisLoading.set(false);
      },
      complete: () => this.analysisLoading.set(false),
    });
  }
}
