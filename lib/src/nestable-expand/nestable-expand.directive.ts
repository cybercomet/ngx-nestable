import { Directive, OnInit, ElementRef } from '@angular/core';

@Directive({
  selector: '[ngxNestableExpand]'
})
export class NestableExpandDirective implements OnInit {

  static readonly REGISTER: 'NESTABLE_EXPAND_REGISTER';

  constructor(private _el: ElementRef) { }

  ngOnInit(): void {
    this._el.nativeElement
      .dispatchEvent(new CustomEvent(
        NestableExpandDirective.REGISTER,
        { bubbles: true }
      ));
  }
}
