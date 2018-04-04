import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NestableComponent } from './nestable.component';
import { NestableDragHandleDirective } from './nestable-drag-handle/nestable-drag-handle.directive';
import { NestableExpandDirective } from './nestable-expand/nestable-expand.directive';

@NgModule({
    imports: [CommonModule],
    declarations: [NestableComponent, NestableDragHandleDirective, NestableExpandDirective],
    exports: [NestableComponent, NestableDragHandleDirective, NestableExpandDirective]
})
export class NestableModule { }
