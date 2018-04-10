import { Directive, ElementRef, HostListener, Input } from '@angular/core';

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
    this.ngxNestableExpandCollapse.item['$$expanded'] = !this
      .ngxNestableExpandCollapse.item['$$expanded'];
  }
}
