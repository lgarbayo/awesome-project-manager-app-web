import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskGantt } from './task-gantt';

describe('TaskGantt', () => {
  let component: TaskGantt;
  let fixture: ComponentFixture<TaskGantt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskGantt]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskGantt);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
