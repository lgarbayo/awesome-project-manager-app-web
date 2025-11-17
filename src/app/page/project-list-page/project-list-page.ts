import { Component, inject, OnInit, signal } from '@angular/core';
import { ProjectService } from '../../service/project-service';
import { Project } from '../../model/project.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-list-page',
  imports: [
    RouterLink
  ],
  templateUrl: './project-list-page.html',
  styleUrl: './project-list-page.scss',
})
export class ProjectListPage implements OnInit {
  private projectService = inject(ProjectService);

  projectList = signal<Array<Project>>([]);

  ngOnInit(): void {
    this.projectService.list().subscribe({
      next: l => this.projectList.set(l),
      error: e => {
        console.error('Unable to fetch project list', e);
        // TODO what to do here?
      }
    });
  }
}
