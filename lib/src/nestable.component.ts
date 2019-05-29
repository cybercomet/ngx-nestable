import {
  Component,
  OnInit,
  Output,
  Input,
  EventEmitter,
  ViewContainerRef,
  Renderer2,
  ElementRef,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';

import { NestableService } from './nestable.service';
import * as helper from './nestable.helper';

import {
  defaultSettings,
  mouse,
  REGISTER_HANDLE,
  DRAG_START,
  EXPAND_COLLAPSE
} from './nestable.constant';
import { NestableSettings } from './nestable.models';

type DisplayType = 'block' | 'none';

const PX = 'px';
const hasPointerEvents = (function () {
  const el = document.createElement('div'),
    docEl = document.documentElement;

  if (!('pointerEvents' in el.style)) {
    return false;
  }

  el.style.pointerEvents = 'auto';
  el.style.pointerEvents = 'x';
  docEl.appendChild(el);
  const supports =
    window.getComputedStyle &&
    window.getComputedStyle(el, '').pointerEvents === 'auto';
  docEl.removeChild(el);
  return !!supports;
})();

@Component({
  selector: 'ngx-nestable',
  templateUrl: './nestable.component.html',
  styleUrls: ['./nestable.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NestableComponent implements OnInit, OnDestroy {
  @Output() public listChange = new EventEmitter();
  @Output() public drop = new EventEmitter();
  @Output() public drag = new EventEmitter();
  @Output() public disclosure = new EventEmitter();

  @Input() public template: ViewContainerRef;
  @Input() public options = defaultSettings;
  @Input() public disableDrag = false;
  @Input()
  public get list() {
    return this._list;
  }
  public set list(list) {
    this._list = list;
    this._generateItemIdAndParent();
  }

  public dragRootEl = null;
  public dragEl = null;
  public dragModel = null;
  public moving = false;

  /**
   * Dragged element contains children, and those children contain other children and so on...
   * This property gives you the number of generations contained within the dragging item.
   */
  public dragDepth = 0;

  /**
   * The depth of dragging item relative to element root (ngx-nestable)
   */
  public relativeDepth = 0;

  public pointEl = null;
  public items = [];

  private _mouse = Object.assign({}, mouse);
  private _list = [];

  private _currentGroup: Number;
  private _cancelMousemove: Function;
  private _cancelMouseup: Function;
  private _placeholder;
  private _registerHandleDirective = false;
  private _dragIndex;
  private _parentList;

  constructor(
    private service: NestableService,
    private ref: ChangeDetectorRef,
    private renderer: Renderer2,
    private el: ElementRef,
  ) { }

  ngOnInit(): void {
    // set/extend default options
    const optionKeys = Object.keys(defaultSettings);
    for (const key of optionKeys) {
      if (typeof this.options[key] === 'undefined') {
        this.options[key] = defaultSettings[key];
      }
    }

    this._generateItemIdAndParent();
    this._generateItemExpanded();
    this._createHandleListener();

    this._currentGroup = this.options.group;
    this.el.nativeElement.dataset['group'] = this.options.group;
    this.el.nativeElement.addEventListener('group-dispatch', event => {
      const nestable: NestableComponent = event.detail.nestable;
      this.dragModel = nestable.dragModel;
      this.dragEl = nestable.dragEl;
      this._placeholder = nestable._placeholder;
      this._parentList = nestable._parentList;
      this._dragIndex = nestable._dragIndex;
      this.pointEl = nestable.pointEl;

      this.dragStop(event);
    });
  }

  ngOnDestroy(): void { }

  private _generateItemIdAndParent() {
    helper._traverseChildren(this._list, item => {
      if (typeof item['$$id'] === 'undefined') {
        item['$$id'] = this.service.generateID();
      }
    });
  }

  private _generateItemExpanded() {
    helper._traverseChildren(this._list, item => {
      if (typeof item.expanded === 'undefined') {
        item['$$expanded'] = true;
      } else {
        item['$$expanded'] = item.expanded;
      }
    });
  }

  private _createHandleListener() {
    this.renderer.listen(this.el.nativeElement, REGISTER_HANDLE, () => {
      this._registerHandleDirective = true;
    });

    this.renderer.listen(this.el.nativeElement, DRAG_START, ({ detail }) => {
      this.dragStart(
        detail.event,
        detail.param.item,
        detail.param.parentList
      );
    });

    this.renderer.listen(this.el.nativeElement, EXPAND_COLLAPSE, data => {
      this.disclosure.emit({
        item: data.detail.item,
        expanded: data.detail.item['$$expanded']
      });
    });
  }

  private _createDragClone(event, dragItem) {
    this._mouseStart(event, dragItem);

    if (!this._registerHandleDirective) {
      this._mouse.offsetY = dragItem.nextElementSibling
        ? dragItem.nextElementSibling.clientHeight / 2
        : dragItem.clientHeight / 2;
    }

    // create drag clone
    this.dragEl = document.createElement(this.options.listNodeName);
    document.body.appendChild(this.dragEl);

    this.renderer.addClass(this.dragEl, this.options.dragClass);

    // add drag clone to body and set css
    this.renderer.setStyle(
      this.dragEl,
      'left',
      event.pageX - this._mouse.offsetX + PX
    );
    this.renderer.setStyle(
      this.dragEl,
      'top',
      event.pageY - this._mouse.offsetY + PX
    );
    this.renderer.setStyle(this.dragEl, 'position', 'absolute');
    this.renderer.setStyle(this.dragEl, 'z-index', 9999);
    this.renderer.setStyle(this.dragEl, 'pointer-events', 'none');
  }

  private _createPlaceholder(event, dragItem) {
    this._placeholder = document.createElement('div');
    this._placeholder.classList.add(this.options.placeClass);
    helper._insertAfter(this._placeholder, dragItem);
    dragItem.parentNode.removeChild(dragItem);
    this.dragEl.appendChild(dragItem);
    this.dragRootEl = dragItem;
  }

  /**
   * Sets depth proerties (relative and drag)
   */
  private _calculateDepth() {
    // total depth of dragging item
    let depth;
    const items = this.dragEl.querySelectorAll(this.options.itemNodeName);
    for (let i = 0; i < items.length; i++) {
      depth = helper._getParents(items[i], this.dragEl).length;
      if (depth > this.dragDepth) {
        this.dragDepth = depth;
      }
    }

    // depth relative to root
    this.relativeDepth = helper._getParents(
      this._placeholder,
      this.el.nativeElement.querySelector(this.options.listNodeName)
    ).length;
  }

  private _mouseStart(event, dragItem) {
    this._mouse.offsetX = event.pageX - helper._offset(dragItem).left;
    this._mouse.offsetY = event.pageY - helper._offset(dragItem).top;
    this._mouse.startX = this._mouse.lastX = event.pageX;
    this._mouse.startY = this._mouse.lastY = event.pageY;
  }

  private _mouseUpdate(event) {
    // mouse position last events
    this._mouse.lastX = this._mouse.nowX;
    this._mouse.lastY = this._mouse.nowY;
    // mouse position this events
    this._mouse.nowX = event.pageX;
    this._mouse.nowY = event.pageY;
    // distance mouse moved between events
    this._mouse.distX = this._mouse.nowX - this._mouse.lastX;
    this._mouse.distY = this._mouse.nowY - this._mouse.lastY;
    // direction mouse was moving
    this._mouse.lastDirX = this._mouse.dirX;
    this._mouse.lastDirY = this._mouse.dirY;
    // direction mouse is now moving (on both axis)
    this._mouse.dirX =
      this._mouse.distX === 0 ? 0 : this._mouse.distX > 0 ? 1 : -1;
    this._mouse.dirY =
      this._mouse.distY === 0 ? 0 : this._mouse.distY > 0 ? 1 : -1;
  }

  /**
   * Showing masks is used to easly determinate ITEM or GROUP over which we are hovering
   */
  private _toggleMasks(display: DisplayType) {
    const itemMasks = <HTMLScriptElement[]><any>document
      .getElementsByClassName('nestable-item-mask');

    for (const item of itemMasks) {
      item.style.display = display;
    }
  }

  /**
   * calc mouse traverse distance on axis
   * @param m - mouse
   */
  private _calcMouseDistance(m) {
    m.distAxX += Math.abs(m.distX);
    if (m.dirX !== 0 && m.dirX !== m.lastDirX) {
      m.distAxX = 0;
    }

    m.distAxY += Math.abs(m.distY);
    if (m.dirY !== 0 && m.dirY !== m.lastDirY) {
      m.distAxY = 0;
    }
  }

  private _move(event) {
    let list;

    this.renderer.setStyle(
      this.dragEl,
      'left',
      event.pageX - this._mouse.offsetX + PX
    );
    this.renderer.setStyle(
      this.dragEl,
      'top',
      event.pageY - this._mouse.offsetY + PX
    );

    this._mouseUpdate(event);

    // axis mouse is now moving on
    const newAx =
      Math.abs(this._mouse.distX) > Math.abs(this._mouse.distY) ? 1 : 0;

    // do nothing on first move
    if (!this._mouse.moving) {
      this._mouse.dirAx = newAx;
      this._mouse.moving = 1;
      return;
    }

    // calc distance moved on this axis (and direction)
    if (this._mouse.dirAx !== newAx) {
      this._mouse.distAxX = 0;
      this._mouse.distAxY = 0;
    } else {
      this._calcMouseDistance(this._mouse);
    }
    this._mouse.dirAx = newAx;

    // find list item under cursor
    if (!hasPointerEvents) {
      this.dragEl.style.visibility = 'hidden';
    }

    const pointEl = <HTMLScriptElement>document.elementFromPoint(
      event.pageX - document.body.scrollLeft,
      event.pageY - (window.pageYOffset || document.documentElement.scrollTop)
    );

    if (!hasPointerEvents) {
      this.dragEl.style.visibility = 'visible';
    }

    if (!pointEl) { return; }

    if (pointEl.classList.contains('nestable-item-mask') ||
      pointEl.classList.contains(this.options.placeClass)
    ) {
      this.pointEl = pointEl.parentElement.parentElement;
    } else {
      return;
    }

    /**
     * move horizontal
     */
    if (
      !this.options.fixedDepth &&
      this._mouse.dirAx &&
      this._mouse.distAxX >= this.options.threshold
    ) {
      // reset move distance on x-axis for new phase
      this._mouse.distAxX = 0;
      const previous = this._placeholder.previousElementSibling;

      // increase horizontal level if previous sibling exists, is not collapsed, and can have children
      if (this._mouse.distX > 0 && previous) {
        list = previous.querySelectorAll(this.options.listNodeName);
        list = list[list.length - 1];

        // check if depth limit has reached
        const depth = helper._getParents(
          this._placeholder,
          this.el.nativeElement.querySelector(this.options.listNodeName)
        ).length;

        if (depth + this.dragDepth <= this.options.maxDepth) {
          // create new sub-level if one doesn't exist
          if (!list) {
            list = document.createElement(this.options.listNodeName);
            list.style.paddingLeft = this.options.threshold + PX;
            list.appendChild(this._placeholder);
            previous.appendChild(list);
            // this.setParent(previous);
          } else {
            // else append to next level up
            list = previous.querySelector(
              `:scope > ${this.options.listNodeName}`
            );
            list.appendChild(this._placeholder);
          }
        }
      }
      // decrease horizontal level
      if (this._mouse.distX < 0) {
        // we can't decrease a level if an item preceeds the current one
        const next = document.querySelector(
          `.${this.options.placeClass} + ${this.options.itemNodeName}`
        );
        const parentElement = this._placeholder.parentElement;
        if (!next && parentElement) {
          const closestItem = helper._closest(
            this._placeholder,
            this.options.itemNodeName
          );

          if (closestItem) {
            parentElement.removeChild(this._placeholder);
            helper._insertAfter(this._placeholder, closestItem);
          }
        }
      }
    }

    if (!pointEl.classList.contains('nestable-item-mask')) {
      return;
    }

    let groupSwap = false;
    if (this.pointEl.dataset && this.pointEl.dataset['group']) {
      if (Number(this.pointEl.dataset['group']) !== this._currentGroup) {
        this._currentGroup = Number(this.pointEl.dataset['group']);
        groupSwap = true;
      }
    }

    /**
     * move vertical
     */
    if (!this._mouse.dirAx || groupSwap) {

      // check depth limit
      const rootUL = <HTMLElement>document.querySelector(`ngx-nestable[data-group="${this._currentGroup}"] ${this.options.listNodeName}`);
      const pointRelativeDepth = helper._getParents(this.pointEl, rootUL).length;
      const depth = this.dragDepth - 1 + pointRelativeDepth;

      if (depth > this.options.maxDepth) {
        return;
      }

      const before = event.pageY < helper._offset(this.pointEl).top + this.pointEl.clientHeight / 2;

      if (this.options.fixedDepth) {
        if (pointRelativeDepth === this.relativeDepth - 1) {
          const childList = this.pointEl.querySelector(this.options.listNodeName);

          if (!childList.children.length) {
            childList.appendChild(this._placeholder);
          }
        } else if (pointRelativeDepth === this.relativeDepth) {
          if (before) {
            this.pointEl.parentElement.insertBefore(this._placeholder, this.pointEl);
          } else {
            helper._insertAfter(this._placeholder, this.pointEl);
          }

          if (this.pointEl.parentElement.children.indexOf(this.pointEl) === this.pointEl.parentElement.children.length - 1) {
            helper._insertAfter(this._placeholder, this.pointEl);
          }
        }
      } else if (before) {
        this.pointEl.parentElement.insertBefore(
          this._placeholder,
          this.pointEl
        );
      } else {
        helper._insertAfter(this._placeholder, this.pointEl);
      }
    }
  }

  private _dispatchToGroup() {
    const nestableContainerTarget = document.querySelector(`[data-group="${this.pointEl.dataset['group']}"]`)
    const customEvent = new CustomEvent('group-dispatch', {
      detail: { nestable: this }
    });

    nestableContainerTarget.dispatchEvent(customEvent);
  }

  public reset() {
    const keys = Object.keys(this._mouse);
    for (const key of keys) {
      this._mouse[key] = 0;
    }

    this.items = [];
    this._cancelMousemove = undefined
    this._cancelMouseup = undefined
    this._placeholder = null;
    this._registerHandleDirective = false;
    this._dragIndex = undefined;

    this._currentGroup = this.options.group;
    this._parentList = undefined;
    this.dragModel = null;
    this.moving = false;
    this.dragEl = null;
    this.dragRootEl = null;
    this.dragDepth = 0;
    this.relativeDepth = 0;
    this.pointEl = null;
  }

  public dragStartFromItem(event, item, parentList) {
    if (!this._registerHandleDirective) {
      this.dragStart(event, item, parentList);
    }
  }

  private dragStart(event, item, parentList): void {
    this._parentList = parentList;

    if (!this.options.disableDrag) {
      event.stopPropagation();
      event.preventDefault();

      if (event.originalEvent) {
        event = event.originalEvent;
      }

      // allow only first mouse button
      if (event.type.indexOf('mouse') === 0) {
        if (event.button !== 0) {
          return;
        }
      } else {
        if (event.touches.length !== 1) {
          return;
        }
      }

      this.ref.detach();
      this._dragIndex = parentList.indexOf(item);
      this.dragModel = this._parentList[this._dragIndex];

      const dragItem = helper._closest(event.target, this.options.itemNodeName);

      if (dragItem === null) {
        return;
      }

      const dragRect = dragItem.getBoundingClientRect();

      this._toggleMasks('block');
      this._createDragClone(event, dragItem);
      this.renderer.setStyle(this.dragEl, 'width', dragRect.width + PX);

      this._createPlaceholder(event, dragItem);
      this.renderer.setStyle(this._placeholder, 'height', dragRect.height + PX);

      this._calculateDepth();
      this.drag.emit({
        originalEvent: event,
        item
      });

      this._cancelMouseup = this.renderer.listen(
        document,
        'mouseup',
        this.dragStop.bind(this)
      );
      this._cancelMousemove = this.renderer.listen(
        document,
        'mousemove',
        this.dragMove.bind(this)
      );
    }
  }

  public dragStop(event): void {
    let placeholderContainer, changedElementPosition;

    if (typeof this._cancelMousemove === 'function') {
      this._cancelMousemove();
    }

    if (typeof this._cancelMouseup === 'function') {
      this._cancelMouseup();
    }

    this._toggleMasks('none');

    if (this.dragEl && this.pointEl) {

      if (Number(this.pointEl.dataset['group']) !== this.options.group) {
        this._dispatchToGroup();
        this.ref.reattach();
        this.reset();
        return;
      }

      this._parentList.splice(this._dragIndex, 1)[0];

      placeholderContainer = helper._closest(
        this._placeholder,
        this.options.itemNodeName
      );

      if (placeholderContainer === null) { // placeholder in root
        this.list.splice(
          Array.prototype.indexOf.call(
            this._placeholder.parentElement.children,
            this._placeholder
          ),
          0,
          { ...this.dragModel }
        );
      } else { // palceholder nested
        const placeholderContainerModel = helper.
          _findObjectInTree(this.list, Number(placeholderContainer.id));

        if (!placeholderContainerModel.children) {
          placeholderContainerModel.children = [];
          placeholderContainerModel.children.push({ ...this.dragModel });
        } else {
          placeholderContainerModel.children.splice(
            Array.prototype.indexOf.call(
              this._placeholder.parentElement.children,
              this._placeholder
            ),
            0,
            { ...this.dragModel }
          );
        }
      }

      this._generateItemIdAndParent();
    } else {
      this._parentList[this._parentList.indexOf(this.dragModel)] = { ...this.dragModel };
    }

    this._placeholder.parentElement.removeChild(this._placeholder);
    this.dragEl.parentNode.removeChild(this.dragEl);
    this.dragEl.remove();
    this.reset();

    this.listChange.emit(this.list);
    this.drop.emit({
      originalEvent: event,
      destination: placeholderContainer,
      item: this.dragModel,
    });
    this.ref.reattach();
  }

  public dragMove(event) {
    if (this.dragEl) {
      event.preventDefault();

      if (event.originalEvent) {
        event = event.originalEvent;
      }
      this._move(event.type.indexOf('mouse') === 0 ? event : event.touches[0]);
    }
  }

  public expandAll() {
    helper._traverseChildren(this._list, item => {
      item['$$expanded'] = true;
    });
    this.ref.markForCheck();
  }

  public collapseAll() {
    helper._traverseChildren(this._list, item => {
      item['$$expanded'] = false;
    });
    this.ref.markForCheck();
  }
}
