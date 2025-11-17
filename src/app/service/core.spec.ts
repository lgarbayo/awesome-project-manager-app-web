import { TestBed } from '@angular/core/testing';

import { Core } from './core';

describe('Core', () => {
  let service: Core;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Core);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
