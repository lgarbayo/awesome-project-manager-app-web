import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, QueryList, computed, effect, inject, input, output, signal, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreService } from '../../../service/core-service';
import { Task } from '../../../model/task.model';
import { Milestone } from '../../../model/milestone.model';
import { ProjectAnalysis, TaskAnalysis } from '../../../model/analysis.model';

type TimelineWeek = { label: string; start: number; end: number };
type TimelineMonth = { label: string; start: number; end: number };
type DragMode = 'move' | 'resize-start' | 'resize-end';
type DragState = {
  task: Task;
  mode: DragMode;
  startX: number;
  initialStart: number;
  initialEnd: number;
  trackRect: DOMRect;
};

@Component({
  selector: 'app-task-gantt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-gantt.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskGantt implements AfterViewInit {
  private core = inject(CoreService);

  tasks = input<ReadonlyArray<Task>>([]);
  milestones = input<ReadonlyArray<Milestone>>([]);
  analysis = input<ProjectAnalysis | undefined>(undefined);
  loading = input<boolean>(false);
  error = input<string | null>(null);

  addTask = output<void>();
  describeTask = output<Task>();
  analyseTask = output<string>();
  estimateTask = output<Task>();
  aiDescribeTask = output<Task>();
  editTask = output<Task>();
  removeTask = output<string>();
  updateTaskTimeline = output<{ task: Task; startDate: Date; durationWeeks: number }>();

  @ViewChild('ganttViewport') private ganttViewport?: ElementRef<HTMLDivElement>;
  @ViewChildren('ganttRow') private ganttRows?: QueryList<ElementRef<HTMLDivElement>>;

  private timelineStart = signal(0);
  private timelineDuration = signal(1);
  private currentScroll = 0;
  protected weeks = signal<Array<TimelineWeek>>([]);
  protected months = signal<Array<TimelineMonth>>([]);
  private dragPreview = signal<Record<string, { start: number; end: number }>>({});
  private dragState: DragState | null = null;
  private readonly weekMs = 7 * 24 * 60 * 60 * 1000;
  protected timelineWidth = computed(() => {
    const months = this.months().length || 1;
    const minWidth = 720;
    const perMonth = 140;
    return Math.max(months * perMonth, minWidth);
  });

  constructor() {
    effect(() => {
      const tasks = this.tasks();
      const milestones = this.milestones();
      this.computeTimeline(tasks, milestones);
    });
  }

  ngAfterViewInit(): void {
    this.ganttRows?.changes.subscribe(() => this.syncScrollPosition());
    queueMicrotask(() => this.syncScrollPosition());
  }

  protected taskList(): ReadonlyArray<Task> {
    return this.tasks();
  }

  protected hasTasks(): boolean {
    return this.tasks().length > 0;
  }

  protected timelineWeeks(): Array<TimelineWeek> {
    return this.weeks();
  }

  protected timelineMonths(): Array<TimelineMonth> {
    return this.months();
  }

  protected weekMarkerPosition(week: TimelineWeek): number {
    const duration = this.timelineDuration();
    if (!duration) return 0;
    return ((week.start - this.timelineStart()) / duration) * 100;
  }

  protected monthWidth(month: TimelineMonth): number {
    const duration = this.timelineDuration();
    if (!duration) return 0;
    return ((month.end - month.start) / duration) * 100;
  }

  protected taskStartOffset(task: Task): number {
    const startDate = this.previewedStart(task);
    return ((startDate - this.timelineStart()) / this.timelineDuration()) * 100;
  }

  protected taskDurationPercent(task: Task): number {
    const start = this.previewedStart(task);
    const end = this.previewedEnd(task);
    return Math.max(((end - start) / this.timelineDuration()) * 100, 2);
  }

  protected taskTooltip(task: Task): string {
    const start = this.formatTooltipDate(this.toDate(task.startDate));
    const end = this.formatTooltipDate(this.computeTaskEnd(task));
    const completion = this.taskCompletionPercent(task);
    return completion !== null ? `${start} → ${end} · ${completion.toFixed(0)}% complete` : `${start} → ${end}`;
  }

  protected onGanttScroll(event: Event): void {
    const element = event.target as HTMLElement | null;
    const scrollLeft = element?.scrollLeft ?? 0;
    this.currentScroll = scrollLeft;
    this.ganttRows?.forEach((row) => {
      if (row.nativeElement !== element && row.nativeElement.scrollLeft !== scrollLeft) {
        row.nativeElement.scrollLeft = scrollLeft;
      }
    });
    const viewport = this.ganttViewport?.nativeElement;
    if (viewport && viewport !== element && viewport.scrollLeft !== scrollLeft) {
      viewport.scrollLeft = scrollLeft;
    }
  }

  private computeTimeline(tasks: ReadonlyArray<Task>, milestones: ReadonlyArray<Milestone>): void {
    const baseline = this.computeTimelineBaseline(tasks, milestones);
    const end = this.computeTimelineEnd(tasks, milestones, baseline);
    const months = this.buildTimelineMonths(baseline, end);
    const weeks = this.buildTimelineWeeks(baseline, end);
    this.timelineStart.set(baseline);
    this.timelineDuration.set(Math.max(end - baseline, 1));
    this.months.set(months);
    this.weeks.set(weeks);
  }

  private computeTimelineBaseline(tasks: ReadonlyArray<Task>, milestones: ReadonlyArray<Milestone>): number {
    if (tasks.length) {
      const starts = tasks.map((task) => this.toDate(task.startDate).getTime());
      return this.monthStart(new Date(Math.min(...starts)));
    }
    if (milestones.length) {
      const sorted = [...milestones].sort((a, b) => {
        if (a.date.year !== b.date.year) return a.date.year - b.date.year;
        if (a.date.month !== b.date.month) return (a.date.month ?? 0) - (b.date.month ?? 0);
        return (a.date.week ?? 0) - (b.date.week ?? 0);
      });
      return this.monthStart(this.toDate(sorted[0].date));
    }
    return this.monthStart(new Date());
  }

  private computeTimelineEnd(
    tasks: ReadonlyArray<Task>,
    milestones: ReadonlyArray<Milestone>,
    baseline: number
  ): number {
    const minMonths = 8;
    const candidates = [this.addMonths(baseline, minMonths)];
    if (tasks.length) {
      const taskEnds = tasks.map((task) => this.computeTaskEnd(task).getTime());
      candidates.push(this.monthEnd(new Date(Math.max(...taskEnds))));
    }
    if (milestones.length) {
      const milestoneDates = milestones.map((milestone) => this.toDate(milestone.date).getTime());
      candidates.push(this.monthEnd(new Date(Math.max(...milestoneDates))));
    }
    return Math.max(...candidates);
  }

  private buildTimelineMonths(startMs: number, endMs: number): Array<TimelineMonth> {
    const months: Array<TimelineMonth> = [];
    if (endMs <= startMs) {
      return months;
    }
    let cursor = startMs;
    while (cursor < endMs) {
      const current = new Date(cursor);
      const monthName = this.core.monthNames[current.getMonth()] ?? `Month ${current.getMonth() + 1}`;
      const nextMonthStart = this.addMonths(cursor, 1);
      months.push({ label: `${monthName} ${current.getFullYear()}`, start: cursor, end: Math.min(nextMonthStart, endMs) });
      cursor = nextMonthStart;
    }
    return months;
  }

  private buildTimelineWeeks(startMs: number, endMs: number): Array<TimelineWeek> {
    const weeks: Array<TimelineWeek> = [];
    if (endMs <= startMs) {
      return weeks;
    }
    let cursor = startMs;
    let index = 1;
    while (cursor < endMs) {
      const start = cursor;
      const end = Math.min(cursor + this.weekMs, endMs);
      weeks.push({ label: `${index}`, start, end });
      cursor = end;
      index++;
    }
    return weeks;
  }

  private computeTaskEnd(task: Task): Date {
    const start = this.toDate(task.startDate);
    const durationWeeks = Math.max(task.durationWeeks, 0);
    return new Date(start.getTime() + durationWeeks * this.weekMs);
  }

  private toDate(date: { year: number; month?: number | null; week?: number | null }): Date {
    return new Date(date.year, date.month ?? 0, 1 + (date.week ?? 0) * 7);
  }

  private monthStart(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  }

  private monthEnd(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
  }

  private addMonths(timeMs: number, monthsToAdd: number): number {
    const reference = new Date(timeMs);
    return new Date(reference.getFullYear(), reference.getMonth() + monthsToAdd, 1).getTime();
  }

  private taskCompletionPercent(task: Task): number | null {
    const analysis = this.findTaskAnalysis(task.uuid);
    if (!analysis) {
      return null;
    }
    return analysis.endCompletion * 100;
  }

  private findTaskAnalysis(taskUuid: string): TaskAnalysis | null {
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

  private formatTooltipDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  }

  private syncScrollPosition(): void {
    const scrollLeft = this.currentScroll;
    this.ganttRows?.forEach((row) => {
      if (row.nativeElement.scrollLeft !== scrollLeft) {
        row.nativeElement.scrollLeft = scrollLeft;
      }
    });
    const viewport = this.ganttViewport?.nativeElement;
    if (viewport && viewport.scrollLeft !== scrollLeft) {
      viewport.scrollLeft = scrollLeft;
    }
  }

  protected startDrag(event: PointerEvent, task: Task, mode: DragMode): void {
    event.preventDefault();
    event.stopPropagation();
    const track = this.findTrackElement(event.target as HTMLElement);
    if (!track) {
      return;
    }
    const rect = track.getBoundingClientRect();
    this.dragState = {
      task,
      mode,
      startX: event.clientX,
      initialStart: this.toDate(task.startDate).getTime(),
      initialEnd: this.computeTaskEnd(task).getTime(),
      trackRect: rect,
    };
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  protected isDragging(taskUuid: string): boolean {
    return this.dragState?.task.uuid === taskUuid;
  }

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragState) {
      return;
    }
    const { task, mode, startX, initialStart, initialEnd, trackRect } = this.dragState;
    const deltaPx = event.clientX - startX;
    if (trackRect.width === 0) {
      return;
    }
    const ratio = deltaPx / trackRect.width;
    const deltaMs = ratio * this.timelineDuration();
    const timelineStart = this.timelineStart();
    const timelineEnd = timelineStart + this.timelineDuration();
    const minDuration = this.weekMs;
    let previewStart = initialStart;
    let previewEnd = initialEnd;

    if (mode === 'move') {
      const duration = previewEnd - previewStart;
      previewStart = this.clamp(initialStart + deltaMs, timelineStart, timelineEnd - duration);
      previewStart = this.snapToWeek(previewStart);
      previewStart = this.clamp(previewStart, timelineStart, timelineEnd - duration);
      previewEnd = previewStart + duration;
    } else if (mode === 'resize-start') {
      previewStart = this.clamp(initialStart + deltaMs, timelineStart, previewEnd - minDuration);
      previewStart = this.snapToWeek(previewStart);
      previewStart = this.clamp(previewStart, timelineStart, previewEnd - minDuration);
      previewEnd = Math.max(previewEnd, previewStart + minDuration);
    } else {
      previewEnd = this.clamp(initialEnd + deltaMs, previewStart + minDuration, timelineEnd);
      previewEnd = this.snapToWeek(previewEnd);
      previewEnd = this.clamp(previewEnd, previewStart + minDuration, timelineEnd);
      previewStart = Math.min(previewStart, previewEnd - minDuration);
    }
    this.setPreview(task.uuid, previewStart, previewEnd);
  };

  private handlePointerUp = (): void => {
    if (!this.dragState) {
      return;
    }
    const { task } = this.dragState;
    const preview = this.dragPreview()[task.uuid];
    if (preview) {
      const durationWeeks = Math.max(1, Math.round((preview.end - preview.start) / this.weekMs));
      this.updateTaskTimeline.emit({ task, startDate: new Date(preview.start), durationWeeks });
      this.clearPreview(task.uuid);
    }
    this.dragState = null;
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
  };

  private findTrackElement(element: HTMLElement | null): HTMLElement | null {
    let current: HTMLElement | null = element;
    while (current && !current.classList.contains('gantt-track')) {
      current = current.parentElement;
    }
    return current;
  }

  private setPreview(taskUuid: string, start: number, end: number): void {
    const snapshot = { ...this.dragPreview() };
    snapshot[taskUuid] = { start, end };
    this.dragPreview.set(snapshot);
  }

  private clearPreview(taskUuid: string): void {
    const snapshot = { ...this.dragPreview() };
    delete snapshot[taskUuid];
    this.dragPreview.set(snapshot);
  }

  protected previewedStart(task: Task): number {
    return this.dragPreview()[task.uuid]?.start ?? this.toDate(task.startDate).getTime();
  }

  protected previewedEnd(task: Task): number {
    return this.dragPreview()[task.uuid]?.end ?? this.computeTaskEnd(task).getTime();
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private snapToWeek(value: number): number {
    const origin = this.timelineStart();
    return origin + Math.round((value - origin) / this.weekMs) * this.weekMs;
  }
}
