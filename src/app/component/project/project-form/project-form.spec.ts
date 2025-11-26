import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectForm } from './project-form';

describe('ProjectForm', () => {
  let component: ProjectForm;
  let fixture: ComponentFixture<ProjectForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
