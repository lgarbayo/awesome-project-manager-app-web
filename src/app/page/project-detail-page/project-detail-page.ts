import { ChangeDetectionStrategy, Component, effect, inject, signal, ViewChild, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable } from 'rxjs';
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
type Identifiable = { uuid: string };
type EntitySaveRequest<Command> = (projectUuid: string, command: Command) => Observable<unknown>;
type EntityUpdateRequest<Command> = (
  projectUuid: string,
  entityUuid: string,
  command: Command
) => Observable<unknown>;
type EntityDeleteRequest = (projectUuid: string, entityUuid: string) => Observable<unknown>;
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
  milestoneAnalysisMessage = signal<string | null>(null);
  taskAnalysisMessage = signal<string | null>(null);
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
    this.openModal(this.showProjectModal);
  }

  closeProjectModal(): void {
    this.closeModal(this.showProjectModal);
  }

  openMilestoneModal(milestone?: Milestone): void {
    this.openSelectionModal(this.selectedMilestone, this.showMilestoneModal, milestone);
  }

  openTaskModal(task?: Task): void {
    this.openSelectionModal(this.selectedTask, this.showTaskModal, task);
  }

  openAnalysisModal(): void {
    this.openModal(this.showAnalysisModal);
  }

  closeAnalysisModal(): void {
    this.closeModal(this.showAnalysisModal);
  }

  openMilestoneAnalysis(milestoneUuid: string): void {
    this.showMilestoneAnalysisModal.set(true);
    this.milestoneAnalysisMessage.set(null);
    const data = this.analysis();
    if (!data) {
      this.selectedMilestoneAnalysis.set(null);
      this.milestoneAnalysisMessage.set('No analysis data available yet.');
      return;
    }
    const detail = data.milestoneList.find((item) => item.milestoneUuid === milestoneUuid) ?? null;
    if (detail) {
      this.selectedMilestoneAnalysis.set(detail);
      return;
    }
    this.selectedMilestoneAnalysis.set(null);
    this.milestoneAnalysisMessage.set("We couldn't find analysis data for this milestone.");
  }

  closeMilestoneAnalysisModal(): void {
    this.closeSelectionModal(this.selectedMilestoneAnalysis, this.showMilestoneAnalysisModal, () => {
      this.milestoneAnalysisMessage.set(null);
    });
  }

  openMilestoneDescription(milestone: Milestone): void {
    this.openSelectionModal(this.selectedMilestoneDescription, this.showMilestoneDescriptionModal, milestone);
  }

  closeMilestoneDescription(): void {
    this.closeSelectionModal(this.selectedMilestoneDescription, this.showMilestoneDescriptionModal);
  }

  openTaskAnalysis(taskUuid: string): void {
    this.showTaskAnalysisModal.set(true);
    this.taskAnalysisMessage.set(null);
    const taskAnalysis = this.findTaskAnalysis(taskUuid);
    if (taskAnalysis) {
      this.selectedTaskAnalysis.set(taskAnalysis);
      return;
    }
    this.selectedTaskAnalysis.set(null);
    this.taskAnalysisMessage.set("We couldn't find analysis data for this task.");
  }

  closeTaskAnalysisModal(): void {
    this.closeSelectionModal(this.selectedTaskAnalysis, this.showTaskAnalysisModal, () => {
      this.taskAnalysisMessage.set(null);
    });
  }

  openTaskDescription(task: Task): void {
    this.openSelectionModal(this.selectedTaskDescription, this.showTaskDescriptionModal, task);
  }

  closeTaskDescription(): void {
    this.closeSelectionModal(this.selectedTaskDescription, this.showTaskDescriptionModal);
  }

  saveMilestone(command: UpsertMilestoneCommand): void {
    this.withProjectUuid((projectUuid) => {
      this.handleEntitySave<Milestone, UpsertMilestoneCommand>({
        projectUuid,
        command,
        editing: this.selectedMilestone(),
        create: (uuid, payload) => this.milestoneService.create(uuid, payload),
        update: (uuid, entityUuid, payload) => this.milestoneService.update(uuid, entityUuid, payload),
        loading: this.milestoneLoading,
        errorSignal: this.milestoneError,
        logMessage: 'Error saving milestone',
        userMessage: "Couldn't save the milestone.",
        selection: this.selectedMilestone,
        modal: this.showMilestoneModal,
        formReset: () => this.milestoneForm?.resetForm(),
        refresh: () => {
          this.loadMilestones(projectUuid);
          this.loadAnalysis(projectUuid);
        },
      });
    });
  }

  removeMilestone(milestoneUuid: string): void {
    this.withProjectUuid((projectUuid) => {
      this.handleEntityRemoval<Milestone>({
        projectUuid,
        entityUuid: milestoneUuid,
        deleteFn: (uuid, entityUuid) => this.milestoneService.delete(uuid, entityUuid),
        loading: this.milestoneLoading,
        errorSignal: this.milestoneError,
        logMessage: 'Error deleting milestone',
        userMessage: "Couldn't delete the milestone.",
        selection: this.selectedMilestone,
        modal: this.showMilestoneModal,
        formReset: () => this.milestoneForm?.resetForm(),
        refresh: () => {
          this.loadMilestones(projectUuid);
          this.loadAnalysis(projectUuid);
        },
      });
    });
  }

  editMilestone(milestone: Milestone): void {
    this.openMilestoneModal(milestone);
  }

  cancelMilestoneEdition(): void {
    this.closeSelectionModal(this.selectedMilestone, this.showMilestoneModal, () => this.milestoneForm?.resetForm());
  }

  saveTask(command: UpsertTaskCommand): void {
    this.withProjectUuid((projectUuid) => {
      this.handleEntitySave<Task, UpsertTaskCommand>({
        projectUuid,
        command,
        editing: this.selectedTask(),
        create: (uuid, payload) => this.taskService.create(uuid, payload),
        update: (uuid, entityUuid, payload) => this.taskService.update(uuid, entityUuid, payload),
        loading: this.taskLoading,
        errorSignal: this.taskError,
        logMessage: 'Error saving task',
        userMessage: "Couldn't save the task.",
        selection: this.selectedTask,
        modal: this.showTaskModal,
        formReset: () => this.taskForm?.resetForm(),
        refresh: () => {
          this.loadTasks(projectUuid);
          this.loadAnalysis(projectUuid);
        },
      });
    });
  }

  removeTask(taskUuid: string): void {
    this.withProjectUuid((projectUuid) => {
      this.handleEntityRemoval<Task>({
        projectUuid,
        entityUuid: taskUuid,
        deleteFn: (uuid, entityUuid) => this.taskService.delete(uuid, entityUuid),
        loading: this.taskLoading,
        errorSignal: this.taskError,
        logMessage: 'Error deleting task',
        userMessage: "Couldn't delete the task.",
        selection: this.selectedTask,
        modal: this.showTaskModal,
        formReset: () => this.taskForm?.resetForm(),
        refresh: () => {
          this.loadTasks(projectUuid);
          this.loadAnalysis(projectUuid);
        },
      });
    });
  }

  editTask(task: Task): void {
    this.openTaskModal(task);
  }

  cancelTaskEdition(): void {
    this.closeSelectionModal(this.selectedTask, this.showTaskModal, () => this.taskForm?.resetForm());
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

  private openModal(modal: WritableSignal<boolean>): void {
    modal.set(true);
  }

  private closeModal(modal: WritableSignal<boolean>): void {
    modal.set(false);
  }

  private openSelectionModal<T>(
    selection: WritableSignal<T | null>,
    modal: WritableSignal<boolean>,
    value?: T | null
  ): void {
    selection.set(value ?? null);
    modal.set(true);
  }

  private closeSelectionModal<T>(
    selection: WritableSignal<T | null>,
    modal: WritableSignal<boolean>,
    cleanup?: () => void
  ): void {
    selection.set(null);
    cleanup?.();
    modal.set(false);
  }

  private withProjectUuid(action: (projectUuid: string) => void): void {
    const projectUuid = this.projectUuid();
    if (projectUuid) {
      action(projectUuid);
    }
  }

  private handleEntitySave<T extends Identifiable, Command>(config: {
    projectUuid: string;
    command: Command;
    editing: T | null;
    create: EntitySaveRequest<Command>;
    update: EntityUpdateRequest<Command>;
    loading: WritableSignal<boolean>;
    errorSignal: WritableSignal<string | null>;
    logMessage: string;
    userMessage: string;
    selection: WritableSignal<T | null>;
    modal: WritableSignal<boolean>;
    formReset?: () => void;
    refresh: () => void;
  }): void {
    const {
      projectUuid,
      command,
      editing,
      create,
      update,
      loading,
      errorSignal,
      logMessage,
      userMessage,
      selection,
      modal,
      formReset,
      refresh,
    } = config;
    loading.set(true);
    const request$ = editing
      ? update(projectUuid, editing.uuid, command)
      : create(projectUuid, command);

    request$.subscribe({
      next: () => {
        formReset?.();
        selection.set(null);
        modal.set(false);
        errorSignal.set(null);
        refresh();
      },
      error: (error) => {
        console.error(logMessage, error);
        errorSignal.set(userMessage);
        loading.set(false);
      },
    });
  }

  private handleEntityRemoval<T extends Identifiable>(config: {
    projectUuid: string;
    entityUuid: string;
    deleteFn: EntityDeleteRequest;
    loading: WritableSignal<boolean>;
    errorSignal: WritableSignal<string | null>;
    logMessage: string;
    userMessage: string;
    selection: WritableSignal<T | null>;
    modal: WritableSignal<boolean>;
    formReset?: () => void;
    refresh: () => void;
  }): void {
    const {
      projectUuid,
      entityUuid,
      deleteFn,
      loading,
      errorSignal,
      logMessage,
      userMessage,
      selection,
      modal,
      formReset,
      refresh,
    } = config;
    loading.set(true);
    deleteFn(projectUuid, entityUuid).subscribe({
      next: () => {
        const current = selection();
        if (current?.uuid === entityUuid) {
          selection.set(null);
          formReset?.();
          modal.set(false);
        }
        errorSignal.set(null);
        refresh();
      },
      error: (error) => {
        console.error(logMessage, error);
        errorSignal.set(userMessage);
        loading.set(false);
      },
    });
  }

  private findTaskAnalysis(taskUuid: string): TaskAnalysis | null {
    const milestoneAnalysis = this.selectedMilestoneAnalysis();
    if (milestoneAnalysis) {
      const fromMilestone = milestoneAnalysis.taskList.find((task) => task.taskUuid === taskUuid);
      if (fromMilestone) {
        return fromMilestone;
      }
    }
    const projectAnalysis = this.analysis();
    if (!projectAnalysis) {
      return null;
    }
    for (const milestone of projectAnalysis.milestoneList) {
      const taskDetail = milestone.taskList.find((task) => task.taskUuid === taskUuid);
      if (taskDetail) {
        return taskDetail;
      }
    }
    return null;
  }

  private loadEntity<T>(config: {
    request: Observable<T>;
    loading: WritableSignal<boolean>;
    errorSignal: WritableSignal<string | null>;
    logMessage: string;
    userMessage: string;
    onSuccess: (value: T) => void;
    onError?: () => void;
  }): void {
    const { request, loading, errorSignal, logMessage, userMessage, onSuccess, onError } = config;
    loading.set(true);
    request.subscribe({
      next: (value) => {
        onSuccess(value);
        errorSignal.set(null);
      },
      error: (error) => {
        console.error(logMessage, error);
        onError?.();
        errorSignal.set(userMessage);
        loading.set(false);
      },
      complete: () => loading.set(false),
    });
  }

  private loadProject(projectUuid: string): void {
    this.loadEntity<Project>({
      request: this.projectService.get(projectUuid),
      loading: this.projectLoading,
      errorSignal: this.projectError,
      logMessage: 'Unable to load project',
      userMessage: "Couldn't load the project.",
      onSuccess: (project) => this.project.set(project),
      onError: () => this.project.set(undefined),
    });
  }

  private loadMilestones(projectUuid: string): void {
    this.loadEntity<Array<Milestone>>({
      request: this.milestoneService.list(projectUuid),
      loading: this.milestoneLoading,
      errorSignal: this.milestoneError,
      logMessage: 'Unable to load milestones',
      userMessage: "Couldn't load the milestones.",
      onSuccess: (milestones) => this.milestones.set(this.sortMilestonesByDate(milestones)),
      onError: () => this.milestones.set([]),
    });
  }

  private loadTasks(projectUuid: string): void {
    this.loadEntity<Array<Task>>({
      request: this.taskService.list(projectUuid),
      loading: this.taskLoading,
      errorSignal: this.taskError,
      logMessage: 'Unable to load tasks',
      userMessage: "Couldn't load the tasks.",
      onSuccess: (tasks) => {
        this.tasks.set(tasks);
        this.computeTaskTimeline(tasks);
      },
      onError: () => this.tasks.set([]),
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
    this.loadEntity<ProjectAnalysis>({
      request: this.analysisService.getProjectAnalysis(projectUuid),
      loading: this.analysisLoading,
      errorSignal: this.analysisError,
      logMessage: 'Unable to load project analysis',
      userMessage: "Couldn't load the analysis.",
      onSuccess: (analysis) => this.analysis.set(analysis),
      onError: () => this.analysis.set(undefined),
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
