import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NestableService } from './nestable.service';
import { NestableComponent } from './nestable.component';
import { NestableDragHandleDirective } from './nestable-drag-handle/nestable-drag-handle.directive';
import { NestableExpandCollapseDirective } from './nestable-expand-collapse-handle/nestable-expand-collapse.directive';
@NgModule({
    imports: [CommonModule],
    declarations: [
        NestableComponent,
        NestableDragHandleDirective,
        NestableExpandCollapseDirective
    ],
    exports: [
        NestableComponent,
        NestableDragHandleDirective,
        NestableExpandCollapseDirective
    ],
    providers: [
        NestableService
    ]
})
export class NestableModule { }
