import { NestableSettings } from './nestable.models';

export const defaultSettings = {
    listNodeName: 'ul',
    itemNodeName: 'li',
    handleNodeName: 'div',
    contentNodeName: 'span',
    rootClass: 'dd',
    listClass: 'dd-list',
    itemClass: 'dd-item',
    dragClass: 'dd-dragel',
    handleClass: 'dd-handle',
    // contentClass: 'dd-content',
    collapsedClass: 'dd-collapsed',
    placeClass: 'dd-placeholder',
    // noDragClass: 'dd-nodrag',
    // noChildrenClass: 'dd-nochildren',
    // emptyClass: 'dd-empty',
    expandBtnHTML: '<button class="dd-expand" data-action="expand" type="button">Expand</button>',
    collapseBtnHTML: '<button class="dd-collapse" data-action="collapse" type="button">Collapse</button>',
    group: 0,
    maxDepth: 5,
    threshold: 20,
    fixedDepth: false, // fixed item's depth
    // fixed: false,
    exportCollapsed: true,
    disableDrag: false, // TODO
    disableNesting: false // TODO
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
