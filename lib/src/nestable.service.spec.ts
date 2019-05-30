import { TestBed, inject } from '@angular/core/testing';

import { NestableService } from './nestable.service';

describe('NestableService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NestableService]
    });
  });

  it('should be created', inject([NestableService], (service: NestableService) => {
    expect(service).toBeTruthy();
  }));
});
