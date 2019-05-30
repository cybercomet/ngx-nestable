import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { EXPAND_COLLAPSE } from '../nestable.constant';

@Directive({
  selector: '[ngxNestableExpandCollapse]'
})
export class NestableExpandCollapseDirective {
  @Input() ngxNestableExpandCollapse;

  constructor(private _el: ElementRef) {}

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event) {
    event.stopPropagation();
  }

  @HostListener('click', ['$event'])
  public onClick(event) {
    const { item } = this.ngxNestableExpandCollapse;
    item['$$expanded'] = !item['$$expanded'];
    this._el.nativeElement.dispatchEvent(
      new CustomEvent(EXPAND_COLLAPSE, {
        bubbles: true,
        detail: this.ngxNestableExpandCollapse
      })
    );
  }
}
