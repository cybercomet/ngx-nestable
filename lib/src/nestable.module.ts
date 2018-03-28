import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NestableComponent } from './nestable.component';

@NgModule({
    imports: [CommonModule],
    declarations: [NestableComponent],
    exports: [NestableComponent]
})
export class NestableModule { }
