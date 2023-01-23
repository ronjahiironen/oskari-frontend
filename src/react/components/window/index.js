import ReactDOM, { unmountComponentAtNode } from 'react-dom';
import React from 'react';
import { Flyout } from './Flyout';
import { Popup } from './Popup';
import { Banner } from './Banner';
import { SidePanel } from './SidePanel';
import { REGISTER, TYPE } from './register';
import { ThemeProvider } from '../../util/contexts';
// expose util function for centering elements
export { getPositionForCentering } from './util';
// expose monitor function for detecting size changes
export { monitorResize, unmonitorResize } from './WindowWatcher';

/* ************************************************
 * Note! The API is not finalized and can change unexpectedly!!
 * ************************************************ */
const ID_PREFIX = 'abstract-';
const NAME = 'OskariWindowing';
export const PLACEMENTS = {
    TOP: 'top',
    BOTTOM: 'bottom',
    RIGHT: 'right',
    LEFT: 'left',
    TL: 'topLeft',
    TR: 'topRight',
    BL: 'bottomLeft',
    BR: 'bottomRight'
};

const DEFAULT_POPUP_OPTIONS = {
    isDraggable: true
};

(function (sb) {
    const module = {
        init: function (sb) {
            sb.registerForEventByName(this, 'UIChangeEvent');
        },
        getName: function () {
            return NAME;
        },
        onEvent: function () {
            REGISTER.clear();
        }
    };

    sb.register(module);
})(Oskari.getSandbox());

const validate = (options, type) => {
    const { id } = options;
    const seq = Oskari.getSeq(NAME);
    if (!id) {
        options.id = ID_PREFIX + seq.nextVal();
    } else if (REGISTER.getExistingWindow(id, type)) {
        // attach a rolling number if we already have a window of same type and id
        const newId = id + '-' + seq.nextVal();
        options.id = newId;
        Oskari.log(NAME).warn(`Popup or flyout is already added with id: ${id}, changed to: ${newId}`);
    }
};

/**
 * Creates a root element to render a flyout/popup window into
 * @returns {HTMLElement}
 */
const createTmpContainer = () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    element.classList.add('oskari-react-tmp-container');
    return element;
};

/**
 * Creates a cleanup function for removing flyout/popup root element
 * @param {HTMLElement} flyout/popup root element
 * @param {Function} optional function to call when window is closed
 * @returns {Function}
 */
const createRemoveFn = (element, onClose) => {
    let alreadyRemoved = false;
    const removeFn = () => {
        if (alreadyRemoved) {
            return;
        }
        unmountComponentAtNode(element);
        document.body.removeChild(element);
        alreadyRemoved = true;
        if (typeof onClose === 'function') {
            onClose();
        }
    };
    return removeFn;
};

/**
 * Creates a function that can be used to modify flyout/popup order on screen.
 * @param {HTMLElement} flyout/popup root element
 * @returns {Function}
 */
const createBringToTop = (element) => {
    return () => {
        if (document.body.lastChild !== element) {
            document.body.appendChild(element);
        }
    };
}

/**
 * Opens a an Oskari popup type of window.
 * Usage:
 *
 *       let popupController = null;
 *       btn.on('click', (event) => {
 *           if (popupController) {
 *               popupController.close();
 *               return;
 *           }
 *           popupController = showPopup('Title', 'Content', () => {
 *               // closed -> cleanup
 *               popupController = null;
 *           });
 *       });
 *
 * @param {String} title title for flyout
 * @param {String|ReactElement} content content for flyout
 * @param {Function} onClose callback that is called when the window closes
 * @param {Object} options (optional) to override default options
 * @returns {Object} that provides functions that can be used to close/update the flyout
 */
export const showPopup = (title, content, onClose, options = {}) => {
    validate(options, TYPE.POPUP);

    const element = createTmpContainer();
    const key = REGISTER.registerWindow(options.id, TYPE.POPUP, createRemoveFn(element, onClose));
    const removeWindow = () => REGISTER.clear(key);
    const bringToTop = createBringToTop(element);
    const opts = {...DEFAULT_POPUP_OPTIONS, ...options };
    const render = (title, content) => {
        ReactDOM.render(
            <ThemeProvider value={options.theme}>
                <Popup title={title} onClose={removeWindow} bringToTop={bringToTop} options={opts}>
                    {content}
                </Popup>
            </ThemeProvider>, element);
    };
    render(title, content);
    return {
        update: render,
        close: removeWindow,
        bringToTop
    };
};

/**
 * Opens a an Oskari flyout type of window.
 * Usage:
 *
 *       let popupController = null;
 *       btn.on('click', (event) => {
 *           if (popupController) {
 *               popupController.close();
 *               return;
 *           }
 *           popupController = showFlyout('Title', 'Content', () => {
 *               // closed -> cleanup
 *               popupController = null;
 *           });
 *       });
 *
 * @param {String} title title for flyout
 * @param {String|ReactElement} content content for flyout
 * @param {Function} onClose callback that is called when the window closes
 * @param {Object} options (optional) to override default options
 * @returns {Object} that provides functions that can be used to close/update the flyout
 */
export const showFlyout = (title, content, onClose, options = {}) => {
    validate(options, TYPE.FLYOUT);
    const element = createTmpContainer();
    const key = REGISTER.registerWindow(options.id, TYPE.FLYOUT, createRemoveFn(element, onClose));
    const removeWindow = () => REGISTER.clear(key);
    const bringToTop = createBringToTop(element);
    const render = (title, content) => {
        ReactDOM.render(
            <ThemeProvider>
                <Flyout title={title} onClose={removeWindow} bringToTop={bringToTop} options={options}>
                    {content}
                </Flyout>
            </ThemeProvider>, element);
    };
    render(title, content);
    return {
        update: render,
        close: removeWindow,
        bringToTop
    };
};

export const showSidePanel = (title, content, onClose, options = {}) => {
    validate(options, TYPE.SIDE_PANEL);
    const element = createTmpContainer();
    const key = REGISTER.registerWindow(options.id, TYPE.SIDE_PANEL, createRemoveFn(element, onClose));
    const removeWindow = () => REGISTER.clear(key);
    const bringToTop = createBringToTop(element);
    const render = (title, content) => {
        ReactDOM.render(
            <ThemeProvider>
                <SidePanel title={title} onClose={removeWindow} bringToTop={bringToTop} options={options}>
                    {content}
                </SidePanel>
            </ThemeProvider>,
            element
        );
    }
    render(title, content);
    return {
        update: render,
        close: removeWindow,
        bringToTop
    };
};


/**
 * 
 * @param {ReactNode} content
 * @param {Function} onClose 
 * @param {boolean} closable 
 * @returns {object} that provides functions that can be used to close/update the banner
 */
export const showBanner = (content, onClose, options = {}) => {
    validate(options, TYPE.BANNER);
    const element = createTmpContainer();
    const key = REGISTER.registerWindow(options.id, TYPE.BANNER, createRemoveFn(element, onClose));
    const removeWindow = () => REGISTER.clear(key);
    const bringToTop = createBringToTop(element);

    const render = (content) => {
        ReactDOM.render(
            <ThemeProvider>
                <Banner onClose={removeWindow} options={options}>
                    {content}
                </Banner>
            </ThemeProvider>, element);
    };
    render(content);
    return  {
        update: render,
        close: removeWindow,
        bringToTop
    };
};

export const getNavigationDimensions = () => {
    let nav = [...Oskari.dom.getRootEl().children].find(c => c.localName === 'nav');
    if (!nav) {
        return {
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            right: 0,
            bottom: 0
        };
    }
    const values = {
        top: nav.offsetTop,
        left: nav.offsetLeft,
        width: nav.clientWidth,
        height: nav.clientHeight,
        right: nav.offsetLeft + nav.clientWidth,
        bottom: nav.offsetTop + nav.clientHeight
    }
    let placement = PLACEMENTS.LEFT;
    if (values.left > 0) {
        placement = PLACEMENTS.RIGHT;
    } else if (values.width > values.height) {
        if (values.top > 0) {
            placement = PLACEMENTS.BOTTOM;
        } else {
            placement = PLACEMENTS.TOP;
        }
    }
    return {
        ...values,
        placement
    };
};
