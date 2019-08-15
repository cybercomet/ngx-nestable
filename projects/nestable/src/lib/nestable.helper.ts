export const _traverseChildren = (tree, callback, parent = null) => {
    for (let i = 0; i < tree.length; i++) {
        const item = tree[i];
        if (typeof item === 'undefined') {
            continue;
        }
        const callbackResult = callback(item, parent);

        if (callbackResult) {
            break;
        }

        if (item.children) {
            _traverseChildren(item.children, callback, item);
        }
    }
};

export const _insertAfter = (newNode, referenceNode) => {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

export const _replace = (newNode, referenceNode) => {
    referenceNode.parentNode.replaceChild(newNode, referenceNode);
};

export const _replaceTargetWithElements = (target, elements) => {
    let i = elements.length;

    if (target.parentNode) {
        while (i--) {
            target.parentNode.insertBefore(elements[i], target);
        }

        /// remove the target.
        target.parentNode.removeChild(target);
    }
};

export const _getParents = (el, parentSelector = document.body) => {

    const parents = [];
    let parentNode = el.parentNode;

    while (parentNode !== parentSelector) {
        const o = parentNode;
        if (!parentNode) {
            break;
        }
        if (parentNode.tagName === parentSelector.tagName) {
            parents.push(o);
        }
        parentNode = o.parentNode;
    }
    parents.push(parentSelector); // Push that parentSelector you wanted to stop at

    return parents;
};

export const _closest = (el, selector) => {
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
        if (parent === null) {
            break;
        }
        const matches = parent[matchesFn](selector);
        if (parent && matches) {
            return parent;
        }
        el = parent;
    }

    return null;
};

export const _offset = (elem) => {
    let box = { top: 0, left: 0 };

    // BlackBerry 5, iOS 3 (original iPhone)
    if (typeof elem.getBoundingClientRect !== undefined) {
        box = elem.getBoundingClientRect();
    }

    return {
        top: box.top + (window.pageYOffset || elem.scrollTop) - (elem.clientTop || 0),
        left: box.left + (window.pageXOffset || elem.scrollLeft) - (elem.clientLeft || 0)
    };
};

export const _findObjectInTree = (array, id) => {
    let result = null;

    _traverseChildren(array, item => {
        if (item['$$id'] === Number.parseInt(id)) {
            result = item;
            return true;
        }
    });

    return result;
};
