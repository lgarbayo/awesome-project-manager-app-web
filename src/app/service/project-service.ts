import { inject, Injectable } from '@angular/core';
import { FormControl, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Project, UpsertProjectCommandForm } from '../model/project.model';
import { CoreService } from './core-service';
import { delay, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';


const DUMMY_PROJECTS: Project[] = [
  {
    uuid: "a1b2c3d4",
    title: "Migración a Microservicios",
    description: "Reestructuración de la arquitectura monolítica hacia microservicios.",
    startDate: { year: 2025, month: 1, week: 2 },
    endDate: { year: 2025, month: 6, week: 4 },
    additionalFields: {
      owner: "Equipo Backend",
      priority: "Alta",
    },
  },
  {
    uuid: "e5f6g7h8",
    title: "Dashboard de Analítica",
    description: "Creación de un panel interactivo con métricas de negocio.",
    startDate: { year: 2024, month: 11, week: 1 },
    endDate: { year: 2025, month: 3, week: 3 },
    additionalFields: {
      owner: "Equipo Frontend",
      status: "En progreso",
    },
  },
  {
    uuid: "i9j0k1l2",
    title: "Integración con Proveedor Externo",
    description: "Implementación de conectores y sincronización de datos.",
    startDate: { year: 2025, month: 2, week: 1 },
    endDate: { year: 2025, month: 4, week: 2 },
    additionalFields: {
      owner: "Integraciones",
      budget: "50k",
    },
  },
];

const DUMMY_MAP = DUMMY_PROJECTS.reduce((acc, p) => {
  acc[p.uuid] = p;
  return acc;
}, {} as Record<string, Project>);


@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private nfb = inject(NonNullableFormBuilder);
  private coreService = inject(CoreService);
  private http = inject(HttpClient);

  list(): Observable<Array<Project>> {
    return this.http.get<any>( // do not use any, only for example
      'https://swapi.dev/api/planets/1/' // stupid request
    ).pipe(
      // since information from the endpoint is not importante we force our own data
      map(() => DUMMY_PROJECTS)
    );
  }

  get(projectUuid: string): Observable<Project> {
    return this.http.get<any>( // do not use any, only for example
      'https://swapi.dev/api/planets/1/' // stupid request
    ).pipe(
      // since information from the endpoint is not importante we force our own data
      map(() => {
        const result = DUMMY_MAP[projectUuid];
        if (!result) {
          throw { status: 404, message: 'project not found' };
        }
        return result;
      }),
      delay(250)
    );
  }

  createProject(command: UpsertProjectCommandForm): Observable<Project> {
    return this.http.post<Project>(
      'path!!',
      command
    );
  }

  updateProject(projectUuid: string, command: UpsertProjectCommandForm): Observable<Project> {
    return this.http.put<Project>(
      `path/${projectUuid}`,
      command
    );
  }

  projectForm(project?: Project): UpsertProjectCommandForm {
    return this.nfb.group({
      title: [project?.title ?? '', [Validators.required]],
      description: project?.description ?? '',
      startDate: this.coreService.dateTypeForm(project?.startDate),
      endDate: this.coreService.dateTypeForm(project?.endDate),
      additionalFields: this.additionalFieldsForm(project?.additionalFields)
    });
  }

  private additionalFieldsForm(additionalFields: Record<string, string> = {}) {
    return this.nfb.record(
      Object.entries(additionalFields).reduce(
        (acc, i) => {
          acc[i[0]] = this.nfb.control(i[1] || '');
          return acc
        },
        {} as { [key: string]: FormControl<string>; })
    )
  }

}
