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
import { MilestoneAnalysis, ProjectAnalysis, TaskAnalysis } from '../../model/analysis.model';
import { ProjectForm } from '../../component/project/project-form/project-form';
import { MilestoneForm } from '../../component/project/milestone-form/milestone-form';
import { TaskForm } from '../../component/project/task-form/task-form';
import { CoreService } from '../../service/core-service';
import { DateType } from '../../model/core.model';

type TimelineWeek = { label: string; start: number; end: number };
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
  selectedMilestoneAnalysis = signal<MilestoneAnalysis | null>(null);
  selectedMilestoneDescription = signal<Milestone | null>(null);
  selectedTaskAnalysis = signal<TaskAnalysis | null>(null);
  selectedTaskDescription = signal<Task | null>(null);

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
  showProjectModal = signal(false);
  showMilestoneModal = signal(false);
  showTaskModal = signal(false);
  showAnalysisModal = signal(false);
  showMilestoneAnalysisModal = signal(false);
  showTaskAnalysisModal = signal(false);
  showMilestoneDescriptionModal = signal(false);
  showTaskDescriptionModal = signal(false);

  private taskTimelineStart = 0;
  private taskTimelineDuration = 1;
  taskTimelineWeeks = signal<Array<TimelineWeek>>([]);

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
        this.showProjectModal.set(false);
      },
      error: (error) => {
        console.error('Error updating project', error);
        this.projectError.set("Couldn't update the project.");
      },
    });
  }
  openProjectModal(): void {
    this.showProjectModal.set(true);
  }

  closeProjectModal(): void {
    this.showProjectModal.set(false);
  }

  openMilestoneModal(milestone?: Milestone): void {
    this.selectedMilestone.set(milestone ?? null);
    this.showMilestoneModal.set(true);
  }

  openTaskModal(task?: Task): void {
    this.selectedTask.set(task ?? null);
    this.showTaskModal.set(true);
  }

  openAnalysisModal(): void {
    this.showAnalysisModal.set(true);
  }

  closeAnalysisModal(): void {
    this.showAnalysisModal.set(false);
  }

  openMilestoneAnalysis(milestoneUuid: string): void {
    const data = this.analysis();
    if (!data) {
      return;
    }
    const detail = data.milestoneList.find((item) => item.milestoneUuid === milestoneUuid);
    if (!detail) {
      return;
    }
    this.selectedMilestoneAnalysis.set(detail);
    this.showMilestoneAnalysisModal.set(true);
  }

  closeMilestoneAnalysisModal(): void {
    this.selectedMilestoneAnalysis.set(null);
    this.showMilestoneAnalysisModal.set(false);
  }

  openMilestoneDescription(milestone: Milestone): void {
    this.selectedMilestoneDescription.set(milestone);
    this.showMilestoneDescriptionModal.set(true);
  }

  closeMilestoneDescription(): void {
    this.selectedMilestoneDescription.set(null);
    this.showMilestoneDescriptionModal.set(false);
  }

  openTaskAnalysis(taskUuid: string): void {
    const analysis = this.selectedMilestoneAnalysis();
    if (!analysis) {
      const projectAnalysis = this.analysis();
      if (!projectAnalysis) return;
      for (const milestone of projectAnalysis.milestoneList) {
        const foundTask = milestone.taskList.find((task) => task.taskUuid === taskUuid);
        if (foundTask) {
          this.selectedTaskAnalysis.set(foundTask);
          this.showTaskAnalysisModal.set(true);
          return;
        }
      }
      return;
    }
    const taskDetail = analysis.taskList.find((task) => task.taskUuid === taskUuid);
    if (!taskDetail) {
      const projectAnalysis = this.analysis();
      if (!projectAnalysis) return;
      for (const milestone of projectAnalysis.milestoneList) {
        const foundTask = milestone.taskList.find((task) => task.taskUuid === taskUuid);
        if (foundTask) {
          this.selectedTaskAnalysis.set(foundTask);
          this.showTaskAnalysisModal.set(true);
          return;
        }
      }
      return;
    }
    this.selectedTaskAnalysis.set(taskDetail);
    this.showTaskAnalysisModal.set(true);
  }

  closeTaskAnalysisModal(): void {
    this.selectedTaskAnalysis.set(null);
    this.showTaskAnalysisModal.set(false);
  }

  openTaskDescription(task: Task): void {
    this.selectedTaskDescription.set(task);
    this.showTaskDescriptionModal.set(true);
  }

  closeTaskDescription(): void {
    this.selectedTaskDescription.set(null);
    this.showTaskDescriptionModal.set(false);
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
        this.showMilestoneModal.set(false);
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
          this.showMilestoneModal.set(false);
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
    this.openMilestoneModal(milestone);
  }

  cancelMilestoneEdition(): void {
    this.selectedMilestone.set(null);
    this.milestoneForm?.resetForm();
    this.showMilestoneModal.set(false);
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
        this.showTaskModal.set(false);
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
          this.showTaskModal.set(false);
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
    this.openTaskModal(task);
  }

  cancelTaskEdition(): void {
    this.selectedTask.set(null);
    this.taskForm?.resetForm();
    this.showTaskModal.set(false);
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
        this.milestones.set(this.sortMilestonesByDate(milestones));
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
        this.computeTaskTimeline(tasks);
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

  private sortMilestonesByDate(list: Array<Milestone>): Array<Milestone> {
    return [...list].sort((a, b) => {
      if (a.date.year !== b.date.year) return a.date.year - b.date.year;
      if (a.date.month !== b.date.month) return a.date.month - b.date.month;
      return a.date.week - b.date.week;
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

  protected taskStartOffset(task: Task): number {
    if (!task.startDate) return 0;
    const start = this.toDate(task.startDate).getTime();
    return ((start - this.taskTimelineStart) / this.taskTimelineDuration) * 100;
  }

  protected taskDurationPercent(task: Task): number {
    if (!task.startDate) return 0;
    const start = this.toDate(task.startDate).getTime();
    const end = this.computeTaskEnd(task).getTime();
    return Math.max(((end - start) / this.taskTimelineDuration) * 100, 2);
  }

  private computeTaskTimeline(tasks: Task[]): void {
    if (!tasks.length) {
      this.taskTimelineStart = Date.now();
      this.taskTimelineDuration = 1;
      this.taskTimelineWeeks.set([]);
      return;
    }
    const starts = tasks.map((task) => this.toDate(task.startDate).getTime());
    const ends = tasks.map((task) => this.computeTaskEnd(task).getTime());
    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);
    const weeks = this.buildTimelineWeeks(minStart, maxEnd);
    if (weeks.length) {
      this.taskTimelineStart = weeks[0].start;
      const lastEnd = weeks[weeks.length - 1].end;
      this.taskTimelineDuration = Math.max(lastEnd - this.taskTimelineStart, 1);
    } else {
      this.taskTimelineStart = minStart;
      this.taskTimelineDuration = Math.max(maxEnd - this.taskTimelineStart, 1);
    }
    this.taskTimelineWeeks.set(weeks);
  }

  private computeTaskEnd(task: Task): Date {
    const start = this.toDate(task.startDate);
    const durationWeeks = Math.max(task.durationWeeks, 0);
    return new Date(start.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);
  }

  private toDate(date: DateType): Date {
    return new Date(date.year, date.month ?? 0, 1 + (date.week ?? 0) * 7);
  }

  protected timelineWeeks(): Array<TimelineWeek> {
    return this.taskTimelineWeeks();
  }

  protected weekMarkerPosition(week: TimelineWeek): number {
    return ((week.start - this.taskTimelineStart) / this.taskTimelineDuration) * 100;
  }

  private buildTimelineWeeks(startMs: number, endMs: number): Array<TimelineWeek> {
    const weeks: Array<TimelineWeek> = [];
    const cursor = this.alignToWeekStart(new Date(startMs));
    let index = 1;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    while (cursor.getTime() <= endMs) {
      const weekStart = cursor.getTime();
      const weekEnd = weekStart + weekMs;
      weeks.push({
        label: `Week ${index}`,
        start: weekStart,
        end: weekEnd,
      });
      cursor.setTime(weekEnd);
      index++;
    }
    const minWeeks = 12;
    while (weeks.length < minWeeks) {
      const last = weeks[weeks.length - 1];
      const nextStart = last ? last.end : cursor.getTime();
      const nextEnd = nextStart + weekMs;
      weeks.push({ label: `Week ${weeks.length + 1}`, start: nextStart, end: nextEnd });
    }
    return weeks;
  }

  private alignToWeekStart(date: Date): Date {
    const aligned = new Date(date);
    aligned.setHours(0, 0, 0, 0);
    const day = aligned.getDay(); // 0 sunday
    const diff = day === 0 ? 0 : day * 24 * 60 * 60 * 1000;
    aligned.setTime(aligned.getTime() - diff);
    return aligned;
  }
}
