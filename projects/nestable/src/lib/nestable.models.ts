export interface NestableSettings {
    listNodeName?: string;
    itemNodeName?: string;
    handleNodeName?: string;
    contentNodeName?: string;
    rootClass?: string;
    listClass?: string;
    itemClass?: string;
    dragClass?: string;
    handleClass?: string;
    contentClass?: string;
    collapsedClass?: string;
    placeClass?: string;
    noDragClass?: string;
    noChildrenClass?: string;
    emptyClass?: string;
    expandBtnHTML?: string;
    collapseBtnHTML?: string;
    group?: number;
    maxDepth?: number;
    threshold?: number;
    fixedDepth?: boolean;
    fixed?: boolean;
    exportCollapsed?: boolean;
    disableDrag?: boolean;
}
