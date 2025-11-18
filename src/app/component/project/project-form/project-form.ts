import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { Project, UpsertProjectCommand } from '../../../model/project.model';
import { ProjectService } from '../../../service/project-service';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-form',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './project-form.html',
  styleUrl: './project-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectForm {
  private projectService = inject(ProjectService);

  form = this.projectService.projectForm();

  data = input<Project>();
  edited = output<UpsertProjectCommand>();

  constructor() {
    effect(() => {
      const project = this.data();
      if (project) {
        this.form.patchValue({
          title: project.title,
          description: project.description
        });
      }
    });
  }

  save(): void {
    if (this.form.valid) {
      this.edited.emit(this.form.getRawValue());
    } else {
      alert('Está mal!!');
    }
  }

}
