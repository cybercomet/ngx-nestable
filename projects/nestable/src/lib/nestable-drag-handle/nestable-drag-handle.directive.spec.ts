import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { NestableDragHandleDirective } from './nestable-drag-handle.directive';

describe('NestableDragHandleDirective', () => {

    const elementRef = {} as ElementRef;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ElementRef, NestableDragHandleDirective]
        });
    });

    it('should create an instance', () => {
        const directive = new NestableDragHandleDirective(elementRef);
        expect(directive).toBeTruthy();
    });
});
