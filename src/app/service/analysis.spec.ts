import { TestBed } from '@angular/core/testing';

import { Analysis } from './analysis';

describe('Analysis', () => {
  let service: Analysis;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Analysis);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
