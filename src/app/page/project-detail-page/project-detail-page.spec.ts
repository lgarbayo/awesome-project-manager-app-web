import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetailPage } from './project-detail-page';

describe('ProjectDetailPage', () => {
  let component: ProjectDetailPage;
  let fixture: ComponentFixture<ProjectDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetailPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
