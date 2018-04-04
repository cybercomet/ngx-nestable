import { Directive, OnInit, ElementRef } from '@angular/core';

@Directive({
  selector: '[ngxNestableDragHandle]'
})
export class NestableDragHandleDirective implements OnInit {

  static readonly REGISTER: 'NESTABLE_DRAG_HANDLE_REGISTER';

  constructor(private _el: ElementRef) { }

  ngOnInit(): void {
    this._el.nativeElement
      .dispatchEvent(new CustomEvent(
        NestableDragHandleDirective.REGISTER,
        { bubbles: true }
      ));
  }
}
