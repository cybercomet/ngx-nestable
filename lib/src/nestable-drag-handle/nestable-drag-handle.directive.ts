import { Directive, OnInit, ElementRef, HostListener, Input } from '@angular/core';

import { REGISTER_HANDLE } from '../nestable.constant';

@Directive({
  selector: '[ngxNestableDragHandle]'
})
export class NestableDragHandleDirective implements OnInit {

  @Input() public ngxNestableDragHandle;

  @HostListener('mousedown') public onMouseDown() {

  }

  constructor(private _el: ElementRef) { }

  ngOnInit(): void {
    this._el.nativeElement
      .dispatchEvent(new CustomEvent(
        REGISTER_HANDLE,
        { bubbles: true }
      ));
  }
}
