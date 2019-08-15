import { NestableSettings } from './nestable.models';

export const REGISTER_HANDLE = 'NESTABLE_DRAG_HANDLE_REGISTER';
export const DRAG_START = 'NESTABLE_DRAG_HANDLE_START';
export const EXPAND_COLLAPSE = 'NESTABLE_EXPAND_COLLAPSE_EVENT';

export const defaultSettings = {
    listNodeName: 'ul',
    itemNodeName: 'li',
    rootClass: 'dd',
    listClass: 'dd-list',
    itemClass: 'dd-item',
    dragClass: 'dd-dragel',
    handleClass: 'dd-handle',
    collapsedClass: 'dd-collapsed',
    placeClass: 'dd-placeholder',
    group: 0, // TODO
    maxDepth: 5,
    threshold: 20,
    fixedDepth: false, // fixed item's depth
    exportCollapsed: true, // TODO
    disableDrag: false,
} as NestableSettings;

export const mouse = {
    moving: 0,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    nowX: 0,
    nowY: 0,
    distX: 0,
    distY: 0,
    dirAx: 0,
    dirX: 0,
    dirY: 0,
    lastDirX: 0,
    lastDirY: 0,
    distAxX: 0,
    distAxY: 0
};
