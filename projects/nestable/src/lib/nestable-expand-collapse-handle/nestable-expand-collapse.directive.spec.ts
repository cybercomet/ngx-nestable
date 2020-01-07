import { NestableExpandCollapseDirective } from './nestable-expand-collapse.directive';
import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NestableDragHandleDirective } from '../nestable-drag-handle/nestable-drag-handle.directive';

describe('NestableExpandCollapseDirective', () => {

    const elementRef = {} as ElementRef;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ElementRef, NestableDragHandleDirective]
        });
    });

    it('should create an instance', () => {
        const directive = new NestableExpandCollapseDirective(elementRef);
        expect(directive).toBeTruthy();
    });
});
