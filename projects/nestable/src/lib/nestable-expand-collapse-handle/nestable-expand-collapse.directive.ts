import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { EXPAND_COLLAPSE } from '../nestable.constant';

@Directive({
    selector: '[ngxNestableExpandCollapse]'
})
export class NestableExpandCollapseDirective {
    @Input() public ngxNestableExpandCollapse;

    constructor(private _el: ElementRef) {}

    @HostListener('mousedown', ['$event'])
    public onMouseDown(event) {
        event.stopPropagation();
    }

    @HostListener('click', ['$event'])
    public onClick(event) {
        this.ngxNestableExpandCollapse.item['$$expanded'] = !this.ngxNestableExpandCollapse.item['$$expanded'];
        this._el.nativeElement.dispatchEvent(
            new CustomEvent(EXPAND_COLLAPSE, {
                bubbles: true,
                detail: this.ngxNestableExpandCollapse
            })
        );
    }
}
