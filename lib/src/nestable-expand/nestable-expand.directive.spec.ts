import { NestableExpandDirective } from './nestable-expand.directive';
import { TestBed, ComponentFixture, inject } from '@angular/core/testing';

import { Directive, OnInit, ElementRef } from '@angular/core';

describe('NestableExpandDirective', () => {

  const elementRef = {} as ElementRef;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ElementRef, NestableExpandDirective]
    });
  });

  it('should create an instance', () => {
    const directive = new NestableExpandDirective(elementRef);
    expect(directive).toBeTruthy();
  });
});
