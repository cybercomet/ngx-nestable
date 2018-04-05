import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NestableComponent } from './nestable.component';
import { NestableDragHandleDirective } from './nestable-drag-handle/nestable-drag-handle.directive';

@NgModule({
    imports: [CommonModule],
    declarations: [
        NestableComponent,
        NestableDragHandleDirective
    ],
    exports: [
        NestableComponent,
        NestableDragHandleDirective
    ]
})
export class NestableModule { }
