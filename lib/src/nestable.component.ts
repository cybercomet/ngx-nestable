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
  NgZone
} from '@angular/core';

import { defaultSettings, mouse } from './nestable.constant';
import { NestableSettings } from './nestable.models';

const PX = 'px';
/**
* Detect CSS pointer-events property
* events are normally disabled on the dragging element to avoid conflicts
* https://github.com/ausi/Feature-detection-technique-for-pointer-events/blob/master/modernizr-pointerevents.js
*/
const hasPointerEvents = (function () {
  const el = document.createElement('div'),
    docEl = document.documentElement;

  if (!('pointerEvents' in el.style)) { return false; }

  el.style.pointerEvents = 'auto';
  el.style.pointerEvents = 'x';
  docEl.appendChild(el);
  const supports = window.getComputedStyle && window.getComputedStyle(el, '').pointerEvents === 'auto';
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

  @Input() public template: ViewContainerRef;
  @Input() public options = defaultSettings;
  @Input()
  public get list() { return this._list; }
  public set list(list) {
    this._list = list;
    this._generateItemIds();
    if (this._componentActive) {
      setTimeout(() => {
        this.reset();
        if (this.options.exportCollapsed) {
          this._traverseChildren(this._list, item => {
            if (item.expanded === false) {
              this.collapseItem(document.getElementById(item['$$id']));
            }
          });
        }
      }, 0);
    }
  }

  public dragRootEl = null;
  public dragEl = null;
  public moving = false;
  public dragDepth = 0;
  public relativeDepth = 0;
  public hasNewRoot = false;
  public pointEl = null;
  public items = [];

  private _componentActive = false;
  private _mouse;
  private _list = [];
  // private _options = Object.assign({}, defaultSettings) as NestableSettings;
  private _cancelMousemove: Function;
  private _cancelMouseup: Function;
  private _placeholder;
  private _itemId = 0;

  constructor(
    private ref: ChangeDetectorRef,
    private renderer: Renderer2,
    private el: ElementRef,
    private _ngZone: NgZone
  ) {
    this._mouse = Object.assign({}, mouse);
  }

  ngOnInit() {
    this._componentActive = true;
    const optionKeys = Object.keys(defaultSettings);
    for (const key of optionKeys) {
      if (typeof this.options[key] === 'undefined') {
        this.options[key] = defaultSettings[key];
      }
    }
    this._init();

  }

  ngOnDestroy(): void {
    this._destroy();
  }

  private _exportCollapsed(li, expanded: boolean) {
    const item = this._findObjectInTree(this._list, li.id);
    if (expanded) {
      delete item.expanded;
    } else {
      item.expanded = false;
    }

    this.el.nativeElement
      .dispatchEvent(new CustomEvent('listUpdated', {
        detail: {
          list: this.list
        },
        bubbles: true
      }));
  }

  private _traverseChildren(tree, callback, parent = null) {
    for (let i = 0; i < tree.length; i++) {
      const item = tree[i];
      if (typeof item === 'undefined') { continue; }
      const callbackResult = callback(item, parent);

      if (callbackResult) { break; }

      if (item.children) {
        this._traverseChildren(item.children, callback, item);
      }
    }
  }

  /**
   * set mousedown listener for all DOM items, and bind remove event
   * listener functions to coresponding elements in list
   */
  private _init() {
    setTimeout(() => {
      this._createDragListeners();
      this._createColapseListeners();
      if (this.options.exportCollapsed) {
        this._traverseChildren(this._list, item => {
          if (item.expanded === false) {
            this.collapseItem(document.getElementById(item['$$id']));
          }
        });
      }
    }, 0);

    this._generateItemIds();
  }

  private _createDragListeners() {
    const itemsDom = this.el.nativeElement.getElementsByClassName(this.options.itemClass);
    for (let i = 0; i < itemsDom.length; i++) {
      if (itemsDom[i].querySelectorAll(`:scope > ${this.options.listNodeName}.${this.options.listClass}`).length
        && !itemsDom[i].querySelectorAll(`:scope > button`).length
      ) {
        itemsDom[i].insertAdjacentHTML('afterbegin', this.options.expandBtnHTML);
        itemsDom[i].insertAdjacentHTML('afterbegin', this.options.collapseBtnHTML);
      }

      this.items[i] = {
        destroy: this.renderer.listen(itemsDom[i], 'mousedown', this.dragStart.bind(this)),
        el: itemsDom[i]
      };
    }
  }

  private _createColapseListeners() {
    const childButtons = this.el.nativeElement.querySelectorAll('[data-action]');
    for (let i = 0; i < childButtons.length; i++) {
      this.renderer.listen(childButtons[i], 'mousedown', e => {
        e.stopPropagation();

        const action = e.target.dataset['action'];
        if (action === 'collapse') {
          this.collapseItem(e.target.parentElement);
        }
        if (action === 'expand') {
          this.expandItem(e.target.parentElement);
        }
      });
    }
  }

  private _generateItemIds() {
    this._traverseChildren(this._list, item => {
      item['$$id'] = this._itemId++;
      // if (!item.children) { item.children = []; }
    });
  }

  private _destroy(el?) {
    if (typeof el === 'undefined') {
      for (const i of this.items) { i.destroy(); }
    } else {
      const target = this.items.find(i => i.el === el);
      if (target) { target.destroy(); }
    }
  }

  private _offset(elem) {
    let box = { top: 0, left: 0 };

    // BlackBerry 5, iOS 3 (original iPhone)
    if (typeof elem.getBoundingClientRect !== undefined) {
      box = elem.getBoundingClientRect();
    }

    return {
      top: box.top + (window.pageYOffset || elem.scrollTop) - (elem.clientTop || 0),
      left: box.left + (window.pageXOffset || elem.scrollLeft) - (elem.clientLeft || 0)
    };
  }

  private _closest(el, selector) {
    let matchesFn;

    // find vendor prefix
    ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function (fn) {
      if (typeof document.body[fn] === 'function') {
        matchesFn = fn;
        return true;
      }
      return false;
    });

    let parent;

    // traverse parents
    while (el) {
      parent = el.parentElement;
      if (parent === null) { break; }
      const matches = parent[matchesFn](selector);
      if (parent && matches) { return parent; }
      el = parent;
    }

    return null;
  }

  private _getParents(el, parentSelector = document.body) {

    const parents = [];
    let parentNode = el.parentNode;

    while (parentNode !== parentSelector) {
      const o = parentNode;
      if (!parentNode) { break; }
      if (parentNode.tagName === parentSelector.tagName) {
        parents.push(o);
      }
      parentNode = o.parentNode;
    }
    parents.push(parentSelector); // Push that parentSelector you wanted to stop at

    return parents;
  }

  private _insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  private _replace(newNode, referenceNode) {
    referenceNode.parentNode.replaceChild(newNode, referenceNode);
  }

  private _createDragClone(event) {
    const target = event.target,
      dragItem = this._closest(target, this.options.itemNodeName + '.' + this.options.itemClass);

    if (dragItem === null) { return; }

    const dragRect = dragItem.getBoundingClientRect();

    this._mouse.offsetX = event.pageX - this._offset(dragItem).left;
    this._mouse.offsetY = event.pageY - this._offset(dragItem).top;
    this._mouse.startX = this._mouse.lastX = event.pageX;
    this._mouse.startY = this._mouse.lastY = event.pageY;

    this.dragEl = document.createElement(this.options.listNodeName);
    document.body.appendChild(this.dragEl);

    this.renderer.addClass(this.dragEl, this.options.dragClass);
    this.renderer.addClass(this.dragEl, this.options.listClass);
    this.renderer.setStyle(this.dragEl, 'width', dragRect.width + PX);

    this._placeholder = document.createElement('div');
    this._placeholder.classList.add(this.options.placeClass);
    this._insertAfter(this._placeholder, dragItem);
    this.renderer.setStyle(this._placeholder, 'height', dragRect.height + PX);
    dragItem.parentNode.removeChild(dragItem);
    this.dragEl.appendChild(dragItem);
    this.dragRootEl = dragItem;

    // add drag clone to body and set css
    this.renderer.setStyle(this.dragEl, 'left', event.pageX - this._mouse.offsetX + PX);
    this.renderer.setStyle(this.dragEl, 'top', event.pageY - this._mouse.offsetY + PX);
    this.renderer.setStyle(this.dragEl, 'position', 'absolute');
    this.renderer.setStyle(this.dragEl, 'z-index', 9999);
    this.renderer.setStyle(this.dragEl, 'pointer-events', 'none');

    // total depth of dragging item
    let depth;
    const items = this.dragEl.querySelectorAll(this.options.itemNodeName);
    for (let i = 0; i < items.length; i++) {
      depth = this._getParents(items[i], this.dragEl).length;
      if (depth > this.dragDepth) { this.dragDepth = depth; }
    }

    // depth relative to root
    this.relativeDepth = this._getParents(this._placeholder,
      this.el.nativeElement.querySelector(this.options.listNodeName + '.' + this.options.listClass)
    ).length;
  }

  // TODO remove create placeholder logic form _createDragClone
  private _createPlaceholder() {

  }

  private _findObjectInTree(array, id) {
    let result = null;

    this._traverseChildren(array, item => {
      if (item['$$id'] === Number.parseInt(id)) {
        result = item;
        return true;
      }
    });

    return result;
  }

  private _replaceTargetWithElements(target, elements) {
    let i = elements.length;

    if (target.parentNode) {
      while (i--) {
        target.parentNode.insertBefore(elements[i], target);
      }

      /// remove the target.
      target.parentNode.removeChild(target);
    }
  }

  private _move(event) {
    let depth, list, isEmpty = false;

    this.renderer.setStyle(this.dragEl, 'left', event.pageX - this._mouse.offsetX + PX);
    this.renderer.setStyle(this.dragEl, 'top', event.pageY - this._mouse.offsetY + PX);

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
    this._mouse.dirX = this._mouse.distX === 0 ? 0 : this._mouse.distX > 0 ? 1 : -1;
    this._mouse.dirY = this._mouse.distY === 0 ? 0 : this._mouse.distY > 0 ? 1 : -1;
    // axis mouse is now moving on
    const newAx = Math.abs(this._mouse.distX) > Math.abs(this._mouse.distY) ? 1 : 0;

    // do nothing on first move
    if (!this._mouse.moving) {
      this._mouse.dirAx = newAx;
      this._mouse.moving = true;
      return;
    }

    // calc distance moved on this axis (and direction)
    if (this._mouse.dirAx !== newAx) {
      this._mouse.distAxX = 0;
      this._mouse.distAxY = 0;
    } else {
      this._mouse.distAxX += Math.abs(this._mouse.distX);
      if (this._mouse.dirX !== 0 && this._mouse.dirX !== this._mouse.lastDirX) {
        this._mouse.distAxX = 0;
      }
      this._mouse.distAxY += Math.abs(this._mouse.distY);
      if (this._mouse.dirY !== 0 && this._mouse.dirY !== this._mouse.lastDirY) {
        this._mouse.distAxY = 0;
      }
    }
    this._mouse.dirAx = newAx;

    /**
     *  find list item under cursor
     */
    if (!hasPointerEvents) { this.dragEl.style.visibility = 'hidden'; }

    this.pointEl = document.elementFromPoint(
      event.pageX - document.body.scrollLeft,
      event.pageY - (window.pageYOffset || document.documentElement.scrollTop)
    );

    if (!hasPointerEvents) { this.dragEl.style.visibility = 'visible'; }

    if (this.pointEl && this.pointEl.classList.contains(this.options.handleClass)) {
      this.pointEl = this._closest(this.pointEl, this.options.itemNodeName + '.' + this.options.itemClass);
    }

    // get point element depth
    let pointDepth;
    if (this.pointEl) {
      pointDepth = this._getParents(this.pointEl,
        this.el.nativeElement.querySelector(this.options.listNodeName + '.' + this.options.listClass)
      ).length;

      // if (this.options.fixedDepth && pointDepth !== this.relativeDepth) { return; }
    } else { return; }

    /**
     * move horizontal
     */
    if (!this.options.fixedDepth
      && this._mouse.dirAx
      && this._mouse.distAxX >= this.options.threshold
    ) {
      // reset move distance on x-axis for new phase
      this._mouse.distAxX = 0;
      const previous = this._placeholder.previousElementSibling;
      // increase horizontal level if previous sibling exists, is not collapsed, and can have children
      if (this._mouse.distX > 0 && previous
        && !previous.classList.contains(this.options.collapsedClass) // cannot increase level when item above is collapsed
        // && !previous.classList.contains(this.options.noChildrenClass)
      ) {

        list = previous.querySelectorAll(this.options.listNodeName + '.' + this.options.listClass);
        list = list[list.length - 1];

        // check if depth limit has reached
        depth = this._getParents(this._placeholder,
          this.el.nativeElement.querySelector(this.options.listNodeName + '.' + this.options.listClass)
        ).length;
        if (depth + this.dragDepth <= this.options.maxDepth) {
          // create new sub-level if one doesn't exist
          if (!list) {
            list = document.createElement(this.options.listNodeName);
            list.classList.add(this.options.listClass);
            list.appendChild(this._placeholder);
            previous.appendChild(list);
            this.setParent(previous);
          } else {
            // else append to next level up
            list = previous.querySelector(`:scope > ${this.options.listNodeName}.${this.options.listClass}`);
            list.appendChild(this._placeholder);
          }
        }
      }
      // decrease horizontal level
      if (this._mouse.distX < 0) {
        // we can't decrease a level if an item preceeds the current one
        const next = document.querySelector(`.${this.options.placeClass} + ${this.options.itemNodeName}.${this.options.itemClass}`);
        const parentElement = this._placeholder.parentElement;
        if (!next && parentElement) {
          const closestItem = this._closest(this._placeholder, this.options.itemNodeName + '.' + this.options.itemClass);

          if (closestItem) {
            parentElement.removeChild(this._placeholder);
            this._insertAfter(this._placeholder, closestItem);
          }

          if (!parentElement.children.length) {
            this.unsetParent(parentElement.parentElement);
          }
        }
      }
    }

    if (this.pointEl && this.pointEl.classList.contains(this.options.emptyClass)) {
      isEmpty = true;
    } else if (!this.pointEl || !this.pointEl.classList.contains(this.options.itemClass)) {
      return;
    }

    // find root list of item under cursor
    const pointElRoot = this._closest(this.pointEl, `.${this.options.rootClass}`),
      isNewRoot = pointElRoot ? this.dragRootEl.dataset['nestable-id'] !== pointElRoot.dataset['nestable-id'] : false;

    /**
     * move vertical
     */
    if (!this._mouse.dirAx || isNewRoot || isEmpty) {
      // check if groups match if dragging over new root
      if (isNewRoot && this.options.group !== pointElRoot.dataset['nestable-group']) {
        return;
      }

      // check depth limit
      depth = this.dragDepth - 1 + this._getParents(this.pointEl,
        this.el.nativeElement.querySelector(this.options.listNodeName + '.' + this.options.listClass)
      ).length;

      if (depth > this.options.maxDepth) { return; }

      const before = event.pageY < (this._offset(this.pointEl).top + this.pointEl.clientHeight / 2);
      const placeholderParent = this._placeholder.parentNode;

      if (this.options.fixedDepth) {
        if (pointDepth === this.relativeDepth - 1) {
          const children = this.pointEl.querySelector(this.options.listNodeName + '.' + this.options.listClass);
          if (!children) {
            const newList = document.createElement(this.options.listNodeName);
            newList.classList.add(this.options.listClass);
            newList.appendChild(this._placeholder);
            this.pointEl.appendChild(newList);
          }
        } else if (pointDepth === this.relativeDepth) {
          if (before) {
            this.pointEl.parentElement.insertBefore(this._placeholder, this.pointEl);
          } else {
            this._insertAfter(this._placeholder, this.pointEl);
          }
        } else { return; }
      } else if (before) {
        this.pointEl.parentElement.insertBefore(this._placeholder, this.pointEl);
      } else {
        this._insertAfter(this._placeholder, this.pointEl);
      }

      if (!placeholderParent.children.length) {
        this.unsetParent(placeholderParent.parentElement);
      }
    }
  }

  public returnOptions() {
    return this.options;
  }

  public updateModelFromDOM(draggedEl) {
    const tempArray = [...this._list];

    // empty model array
    this._list.length = 0;

    const list = this.el.nativeElement
      .querySelector(`${this.options.listNodeName}.${this.options.listClass}`)
      .children;

    this._traverseChildren(list, item => {
      if (item.nodeName === 'LI') {
        if (!item.parentElement.parentElement.id) {
          const child = Object.assign({}, this._findObjectInTree(tempArray, item.id));
          delete child.children;
          this._list.push(child);

          if (!item.querySelector(`:scope > ${this.options.listNodeName}.${this.options.listClass}`)) {
            delete child.expanded;
          }

        } else {
          const parent = this._findObjectInTree(this._list, item.parentElement.parentElement.id);
          if (!parent.children) { parent.children = []; }

          const child = Object.assign({}, this._findObjectInTree(tempArray, item.id));
          delete child.children;

          parent.children.push(child);

          if (!item.querySelector(`:scope > ${this.options.listNodeName}.${this.options.listClass}`)) {
            delete child.expanded;
          }
        }
      }
    });
  }

  public reset() {
    this._mouse = Object.assign({}, mouse);
    this._itemId = 0;

    this.moving = false;
    this.dragEl = null;
    this.dragRootEl = null;
    this.dragDepth = 0;
    this.relativeDepth = 0;
    this.hasNewRoot = false;
    this.pointEl = null;

    this._destroy();

    this._createDragListeners();
    this._createColapseListeners();
  }

  public dragStart(event) {
    event.stopPropagation();

    if (event.originalEvent) { event = event.originalEvent; }

    if (event.type.indexOf('mouse') === 0) {
      if (event.button !== 0) { return; }
    } else {
      if (event.touches.length !== 1) { return; }
    }

    event.preventDefault();
    this.dragRootEl = event.target;

    this._ngZone.runOutsideAngular(() => {
      this._createDragClone(event);
    });

    this._cancelMouseup = this.renderer.listen(document, 'mouseup', this.dragStop.bind(this));
    this._cancelMousemove = this.renderer.listen(document, 'mousemove', this.dragMove.bind(this));

    // this._createPlaceholder(); // TODO
  }

  public dragStop(event) {
    this._cancelMouseup();
    this._cancelMousemove();
    // debugger
    const draggedId = Number.parseInt(this.dragEl.firstElementChild.id);
    this.dragEl.parentNode.removeChild(this.dragEl);
    this._replaceTargetWithElements(this._placeholder, this.dragEl.children);
    this.updateModelFromDOM(document.getElementById(draggedId.toString()));

    this.dragEl.remove();

    this.reset();

    let draggedItem, parentItem;
    this._traverseChildren(this.list, (item, parent) => {
      if (item['$$id'] === draggedId) {
        draggedItem = item, parentItem = parent;
        return true;
      }
    });

    this.el.nativeElement
      .dispatchEvent(new CustomEvent('listUpdated', {
        detail: {
          list: this.list,
          draggedItem,
          parentItem
        },
        bubbles: true
      }));

  }

  public dragMove(event) {
    this._ngZone.runOutsideAngular(() => {
      if (this.dragEl) {
        event.preventDefault();

        if (event.originalEvent) { event = event.originalEvent; }
        this._move(event.type.indexOf('mouse') === 0 ? event : event.touches[0]);
      }
    });
  }

  public expandItem(li) {
    li.classList.remove(this.options.collapsedClass);

    const childButtons = li.querySelectorAll(`:scope > [data-action]`);
    for (let i = 0; i < childButtons.length; i++) {
      const action = childButtons[i].dataset['action'];
      if (action === 'collapse') {
        childButtons[i].style.display = 'block';
      }
      if (action === 'expand') {
        childButtons[i].style.display = 'none';
      }
    }

    if (this.options.exportCollapsed) { this._exportCollapsed(li, true); }
  }

  public collapseItem(li) {
    const lists = li.querySelectorAll(`:scope > ${this.options.listNodeName}.${this.options.listClass}`);
    if (lists.length) {
      li.classList.add(this.options.collapsedClass);
    }
    const childButtons = li.querySelectorAll(`:scope > [data-action]`);
    for (let i = 0; i < childButtons.length; i++) {
      const action = childButtons[i].dataset['action'];
      if (action === 'collapse') {
        childButtons[i].style.display = 'none';
      }
      if (action === 'expand') {
        childButtons[i].style.display = 'block';
      }
    }

    if (this.options.exportCollapsed) { this._exportCollapsed(li, false); }
  }

  public toggle(e, li) {
    e.preventDefault();
    e.stopPropagation();
    console.log(li);
  }

  public expandAll() {
    const items = document.querySelectorAll(`${this.options.itemNodeName}.${this.options.itemClass}`);
    for (let i = 0; i < items.length; i++) {
      this.expandItem(items[i]);
    }
  }

  public collapseAll() {
    const items = document.querySelectorAll(`${this.options.itemNodeName}.${this.options.itemClass}`);
    for (let i = 0; i < items.length; i++) {
      this.collapseItem(items[i]);
    }
  }

  public setParent(li) {
    if (li.querySelectorAll(`:scope > ${this.options.listNodeName}.${this.options.listClass}`).length
      && !li.querySelectorAll(`:scope > button`).length
    ) {
      li.insertAdjacentHTML('afterbegin', this.options.expandBtnHTML);
      li.insertAdjacentHTML('afterbegin', this.options.collapseBtnHTML);
    }
  }

  public unsetParent(li) {
    const childButtons = li.querySelectorAll(`:scope > [data-action]`);
    for (let i = 0; i < childButtons.length; i++) {
      childButtons[i].parentElement.removeChild(childButtons[i]);
      childButtons[i].remove();
    }
    const list = li.querySelector(`${this.options.listNodeName}.${this.options.listClass}`);
    list.parentElement.removeChild(list);
    li.classList.remove(this.options.collapsedClass);
  }

}
