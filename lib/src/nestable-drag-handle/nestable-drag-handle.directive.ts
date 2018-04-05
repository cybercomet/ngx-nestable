import {
  Directive,
  OnInit,
  ElementRef,
  HostListener,
  Input,
  Output
} from '@angular/core';

import { REGISTER_HANDLE, DRAG_START } from '../nestable.constant';
import { EventEmitter } from '@angular/core';

@Directive({
  selector: '[ngxNestableDragHandle]'
})
export class NestableDragHandleDirective implements OnInit {
  @Input() public ngxNestableDragHandle;
  @Output() dragEvent: EventEmitter<any> = new EventEmitter();

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event) {
    const detail = {
      param: this.ngxNestableDragHandle,
      event: event
    };
    this._el.nativeElement.dispatchEvent(
      new CustomEvent(DRAG_START, { bubbles: true, detail: detail })
    );
  }

  constructor(private _el: ElementRef) {}

  ngOnInit(): void {
    this._el.nativeElement.dispatchEvent(
      new CustomEvent(REGISTER_HANDLE, { bubbles: true, detail: this.ngxNestableDragHandle })
    );
  }
}
