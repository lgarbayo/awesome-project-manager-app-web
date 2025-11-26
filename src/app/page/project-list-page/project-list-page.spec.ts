import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectListPage } from './project-list-page';

describe('ProjectListPage', () => {
  let component: ProjectListPage;
  let fixture: ComponentFixture<ProjectListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectListPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
