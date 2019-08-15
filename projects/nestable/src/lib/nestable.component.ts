import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    ViewContainerRef,
    ViewEncapsulation
} from '@angular/core';

import * as helper from './nestable.helper';

import { defaultSettings, DRAG_START, EXPAND_COLLAPSE, mouse, REGISTER_HANDLE } from './nestable.constant';

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
        this._generateItemIds();
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

    public hasNewRoot = false;
    public pointEl = null;
    public items = [];

    private _componentActive = false;
    private _mouse = Object.assign({}, mouse);
    private _list = [];
    // private _options = Object.assign({}, defaultSettings) as NestableSettings;
    private _cancelMousemove: Function;
    private _cancelMouseup: Function;
    private _placeholder;
    private _itemId = 0;
    private _registerHandleDirective = false;
    private _dragIndex;
    private _parentDragId;
    private _oldListLength: any;

    constructor(
        private ref: ChangeDetectorRef,
        private renderer: Renderer2,
        private el: ElementRef,
        private zone: NgZone
    ) {}

    ngOnInit(): void {
        // set/extend default options
        this._componentActive = true;
        const optionKeys = Object.keys(defaultSettings);
        for (const key of optionKeys) {
            if (typeof this.options[key] === 'undefined') {
                this.options[key] = defaultSettings[key];
            }
        }

        this._generateItemIds();
        this._generateItemExpanded();
        this._createHandleListener();
    }

    ngOnDestroy(): void {}

    private _generateItemIds() {
        helper._traverseChildren(this._list, item => {
            item['$$id'] = this._itemId++;
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

        this.renderer.listen(this.el.nativeElement, DRAG_START, data => {
            this.dragStart(
                data.detail.event,
                data.detail.param.item,
                data.detail.param.parentList
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

    private _showMasks() {
        const masks = this.el.nativeElement.getElementsByClassName(
            'nestable-item-mask'
        );
        for (let i = 0; i < masks.length; i++) {
            masks[i].style.display = 'block';
        }
    }

    private _hideMasks() {
        const masks = this.el.nativeElement.getElementsByClassName(
            'nestable-item-mask'
        );
        for (let i = 0; i < masks.length; i++) {
            masks[i].style.display = 'none';
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
        let depth, list;

        const dragRect = this.dragEl.getBoundingClientRect();
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

        const pointEl = document.elementFromPoint(
            event.pageX - document.body.scrollLeft,
            event.pageY - (window.pageYOffset || document.documentElement.scrollTop)
        );

        if (!hasPointerEvents) {
            this.dragEl.style.visibility = 'visible';
        }

        if (
            pointEl &&
            (pointEl.classList.contains('nestable-item-mask') ||
                pointEl.classList.contains(this.options.placeClass))
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
                depth = helper._getParents(
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
                            `:scope > ${ this.options.listNodeName }`
                        );
                        list.appendChild(this._placeholder);
                    }
                }
            }
            // decrease horizontal level
            if (this._mouse.distX < 0) {
                // we can't decrease a level if an item preceeds the current one
                const next = document.querySelector(
                    `.${ this.options.placeClass } + ${ this.options.itemNodeName }`
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

        // find root list of item under cursor
        const pointElRoot = helper._closest(
            this.pointEl,
            `.${ this.options.rootClass }`
            ),
            isNewRoot = pointElRoot
                ? this.dragRootEl.dataset['nestable-id'] !==
                pointElRoot.dataset['nestable-id']
                : false;

        /**
         * move vertical
         */
        if (!this._mouse.dirAx || isNewRoot) {
            // check if groups match if dragging over new root
            if (
                isNewRoot &&
                this.options.group !== pointElRoot.dataset['nestable-group']
            ) {
                return;
            }

            // check depth limit
            depth =
                this.dragDepth -
                1 +
                helper._getParents(
                    this.pointEl,
                    this.el.nativeElement.querySelector(this.options.listNodeName)
                ).length;

            if (depth > this.options.maxDepth) {
                return;
            }

            const before =
                event.pageY <
                helper._offset(this.pointEl).top + this.pointEl.clientHeight / 2;
            const placeholderParent = this._placeholder.parentNode;

            // get point element depth
            let pointRelativeDepth;
            pointRelativeDepth = helper._getParents(
                this.pointEl,
                this.el.nativeElement.querySelector(this.options.listNodeName)
            ).length;

            if (this.options.fixedDepth) {
                if (pointRelativeDepth === this.relativeDepth - 1) {
                    const childList = this.pointEl.querySelector(
                        this.options.listNodeName
                    );
                    if (!childList.children.length) {
                        childList.appendChild(this._placeholder);
                    }
                } else if (pointRelativeDepth === this.relativeDepth) {
                    if (before) {
                        this.pointEl.parentElement.insertBefore(
                            this._placeholder,
                            this.pointEl
                        );
                    } else {
                        helper._insertAfter(this._placeholder, this.pointEl);
                    }

                    if (
                        Array.prototype.indexOf.call(
                            this.pointEl.parentElement.children,
                            this.pointEl
                        ) ===
                        this.pointEl.parentElement.children.length - 1
                    ) {
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

    public reset() {
        const keys = Object.keys(this._mouse);
        for (const key of keys) {
            this._mouse[key] = 0;
        }

        this._itemId = 0;
        this.moving = false;
        this.dragEl = null;
        this.dragRootEl = null;
        this.dragDepth = 0;
        this.relativeDepth = 0;
        this.hasNewRoot = false;
        this.pointEl = null;
    }

    public dragStartFromItem(event, item, parentList) {
        if (!this._registerHandleDirective) {
            this.dragStart(event, item, parentList);
        }
    }

    private dragStart(event, item, parentList) {

        this._oldListLength = this.list.length;

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
            this.dragModel = parentList.splice(parentList.indexOf(item), 1)[0];

            const dragItem = helper._closest(event.target, this.options.itemNodeName);
            if (dragItem === null) {
                return;
            }
            this._parentDragId = Number.parseInt(
                dragItem.parentElement.parentElement.id
            );

            const dragRect = dragItem.getBoundingClientRect();

            this._showMasks();
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

    public dragStop(event) {
        this._cancelMouseup();
        this._cancelMousemove();
        this._hideMasks();

        if (this.dragEl) {
            const draggedId = Number.parseInt(this.dragEl.firstElementChild.id);
            let placeholderContainer = helper._closest(
                this._placeholder,
                this.options.itemNodeName
            );

            let changedElementPosition =
                this._dragIndex !==
                Array.prototype.indexOf.call(
                    this._placeholder.parentElement.children,
                    this._placeholder
                );

            const index = Array.prototype.indexOf.call(this._placeholder.parentElement.children, this._placeholder);

            if ((this._dragIndex === index) && (this._oldListLength === this.list.length)) {
                changedElementPosition = true;
            }

            // placeholder in root
            if (placeholderContainer === null) {
                this.list.splice(
                    Array.prototype.indexOf.call(
                        this._placeholder.parentElement.children,
                        this._placeholder
                    ),
                    0,
                    { ...this.dragModel }
                );
            } else {
                // palceholder nested
                placeholderContainer = helper._findObjectInTree(
                    this.list,
                    Number.parseInt(placeholderContainer.id)
                );
                if (!placeholderContainer.children) {
                    placeholderContainer.children = [];
                    placeholderContainer.children.push({ ...this.dragModel });
                } else {
                    placeholderContainer.children.splice(
                        Array.prototype.indexOf.call(
                            this._placeholder.parentElement.children,
                            this._placeholder
                        ),
                        0,
                        { ...this.dragModel }
                    );
                }
                if (index === this._dragIndex) {
                    changedElementPosition = false;
                }
                if (!changedElementPosition) {
                    changedElementPosition =
                        placeholderContainer['$$id'] !== this._parentDragId;
                }
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
                changedElementPosition
            });
            this.ref.reattach();
        }
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
