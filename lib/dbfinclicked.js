/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL GNOME Shell Extensions
 *
 * Copyright (C) 2013 Vadim Cherepanov @ dbFin <vadim@dbfin.com>
 *
 * YAWL, a group of GNOME Shell extensions, is provided as
 * free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License (GPL)
 * as published by the Free Software Foundation, version 3
 * of the License, or any later version.
 *
 * YAWL is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY: without even implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the License (in file
 * GNUGPLv3) along with the program. A copy of the License
 * is also available at <http://www.gnu.org/licenses/>.
 *
 * dbfinclicked.js
 * Mouse clicks.
 *
 */

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;

const DND = imports.ui.dnd;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinTimeout = Me.imports.dbfintimeout;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinClicked = new Lang.Class({
	Name: 'dbFin.Clicked',

	/* callback(state, variable):       state == { left:, right:, middle:, ctrl:, shift:, clicks:, scroll:, up:, dnd: }
	 *	 					            where left, right, middle, ctrl, shift, scroll, up are either true or false
	 * 									clicks is the number of clicks
     *                                  dnd is 1/2/3 for drag'n'drop begin/cancelled/end
	 *									variable is a string of the form
	 *									'(Left|Right|Middle)(Ctrl)?(Shift)?' or 'Scroll' or 'DND'
	 */
    _init: function(emitter, callback, scope, clicks/* = true*/, doubleClicks/* = false*/,
                    scroll/* = false*/,
                    dragAndDrop/* = false*/, clickOnRelease/* = false*/, longClick/* = false*/,
                    clicksTimeThreshold/* = 377*/, scrollTimeout/* = 125*/) {
        _D('>' + this.__name__ + '._init()');
        this._signals = new dbFinSignals.dbFinSignals();
		this._emitter = emitter;
		this._callback = callback;
		this._scope = scope;
        this._single = !!clicks || clicks === undefined;
		this._double = !!doubleClicks;
        this._scroll = !!scroll;
        this._dnd = !!dragAndDrop && DND.makeDraggable(emitter, { manualMode: true });
		this._release = !!this._dnd || !!clickOnRelease;
        this._longClick = this._release && !!longClick;
        this._clicksTimeThreshold = clicksTimeThreshold || 377;
        this._scrollTimeout = scrollTimeout || 125;
		this._state = {};
        this._timeout = new dbFinTimeout.dbFinTimeout();
        this._delta = 0.0;

        if (this._single) {
		    this._signals.connectNoId({	emitter: this._emitter, signal: 'button-press-event',
								        callback: this._buttonPressEvent, scope: this });
		    if (this._release) {
			    this._signals.connectNoId({	emitter: this._emitter, signal: 'button-release-event',
									        callback: this._buttonReleaseEvent, scope: this });
		    }
        }
        if (this._scroll) {
            this._signals.connectNoId({	emitter: this._emitter, signal: 'scroll-event',
                                        callback: this._scrollEvent, scope: this });
        }
        if (this._dnd) {
            this._signals.connectNoId({ emitter: this._dnd, signal: 'drag-begin',
                                        callback: this._dndDrag, scope: this });
            this._signals.connectNoId({ emitter: this._dnd, signal: 'drag-cancelled',
                                        callback: this._dndCancelled, scope: this });
            this._signals.connectNoId({ emitter: this._dnd, signal: 'drag-end',
                                        callback: this._dndDrop, scope: this });
        }
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
        if (this._timeout) {
            this._timeout.destroy();
            this._timeout = null;
        }
        this._delta = 0.0;
		this._emitter = null;
		this._callback = null;
		this._scope = null;
		this._state = {};
        _D('<');
    },

	_getState: function(event) {
		_D('>' + this.__name__ + '._getState()');
		if (!event || !event.get_button || !event.get_state) {
			_D(!event ? 'event === null' : !event.get_button ? 'event.get_button === null' : 'event.get_state === null');
			_D('<');
			return {};
		}
		let (state = {},
		     eventButton = event.get_button()) {
			if (eventButton > 0 && eventButton <= 3) {
				state.left = eventButton == 1;
				state.right = eventButton == 3;
				state.middle = eventButton == 2;
				state.scroll = false;
				let (eventState = event.get_state()) {
					state.ctrl = !!(eventState & Clutter.ModifierType.CONTROL_MASK);
					state.shift = !!(eventState & Clutter.ModifierType.SHIFT_MASK);
				} // let (eventState)
			} // if (eventButton > 0 && eventButton <= 3)
            _D('<');
            return state;
		} // let (state, eventButton)
	},

	_getStateScroll: function(event) {
		_D('>' + this.__name__ + '._getStateScroll()');
		if (!event || !event.get_scroll_direction) {
			_D(!event ? 'event === null' : 'event.get_scroll_direction === null');
			_D('<');
			return {};
		}
		let (state = {},
		     direction = event.get_scroll_direction(),
             delta = 0.0) {
            // we accumulate delta even within scroll timeout
            if (Clutter.ScrollDirection.SMOOTH && direction === Clutter.ScrollDirection.SMOOTH) {
                delta = event.get_scroll_delta && event.get_scroll_delta() || 0;
                delta = delta && delta.length && delta[1] || 0;
                if (delta != 0.0) {
                    this._delta += delta;
                    if (this._timeout) this._timeout.add('scroll-delta', this._scrollTimeout, function () {
                        this._delta = 0.0;
                    }, this, true);
                }
            }
            else {
                this._delta = 0.0;
            }
            // but we do not send event within the scroll timeout
			if ((!this._timeout || !this._timeout.has('scroll'))
                    && (direction === Clutter.ScrollDirection.UP
                        || direction === Clutter.ScrollDirection.DOWN
                        || Math.abs(this._delta) >= 5.0)) {
				state.left = false;
				state.right = false;
				state.middle = false;
				state.scroll = true;
				state.up = direction === Clutter.ScrollDirection.UP || delta < 0;
                this._delta = 0.0;
                if (this._timeout) this._timeout.add('scroll', this._scrollTimeout, null, null, true);
			}
            _D('<');
            return state;
		} // let (state, direction)
	},

    _getStateNumber: function(state) { // state number: [shift][ctrl][middle/right][left/right]
        _D('>' + this.__name__ + '._getStateNumber()');
        let (stateNumber = 0) {
            if (state.left) stateNumber = 1;
            else if (state.right) stateNumber = 3;
            else if (state.middle) stateNumber = 2;
			if (stateNumber) {
				if (state.ctrl) stateNumber += 4;
				if (state.shift) stateNumber += 8;
			}
    		_D('<');
            return stateNumber;
        } // let (stateNumber)
    },

    _getStateByNumber: function(stateNumber) {
        _D('>' + this.__name__ + '._getStateByNumber()');
        let (state = {}, button = stateNumber & 3) {
            if (button) {
                state.left = button == 1;
                state.right = button == 3;
                state.middle = button == 2;
                state.ctrl = !!(stateNumber & 4);
                state.shift = !!(stateNumber & 8);
            }
    		_D('<');
            return state;
        } // let (state, button)
    },

	_getStateSettingsKey: function(state) {
        _D('>' + this.__name__ + '._getStateSettingsKey()');
		let (key = '') {
			if (state.left || state.right || state.middle) {
				if (state.left) key = 'left';
				else if (state.right) key = 'right';
				else key = 'middle';
				if (state.ctrl) key += '-ctrl';
				if (state.shift) key += '-shift';
			}
			else if (state.scroll) {
				key = 'scroll';
			}
            else if (state.dnd) {
                key = 'dnd';
            }
			_D('<');
			return key;
		} // let (key)
	},

	_getStateVariable: function(state) {
        _D('>' + this.__name__ + '._getStateVariable()');
		let (name = '') {
			if (state.left || state.right || state.middle) {
				if (state.left) name = 'Left';
				else if (state.right) name = 'Right';
				else name = 'Middle';
				if (state.ctrl) name += 'Ctrl';
				if (state.shift) name += 'Shift';
			}
			else if (state.scroll) {
				name = 'Scroll';
			}
            else if (state.dnd) {
                name = 'DND';
            }
			_D('<');
			return name;
		} // let (name)
	},

    _buttonPressEvent: function(actor, event) {
        _D('>' + this.__name__ + '._buttonPressEvent()');
		let (state = this._getState(event)) {
            if (state.left || state.right || state.middle) {
                if (this._timeout) this._timeout.remove('long-click');
				if (!this._release) {
					this._registerClick(state);
				} // if (!this._release)
				else {
					// do not care about modifiers so far
					this._state = {};
					this._state.left = state.left;
					this._state.right = state.right;
					this._state.middle = state.middle;
					if (state.left && this._longClick) {
                        if (this._timeout) this._timeout.add('long-click', Math.max(1000, this._clicksTimeThreshold * 2), function () {
                            let (state = {},
                                 [ x, y, m ] = global.get_pointer()) {
                                this._state = {};
                                state.right = true;
                                state.ctrl = !!(m & Clutter.ModifierType.CONTROL_MASK);
                                state.shift = !!(m & Clutter.ModifierType.SHIFT_MASK);
                                // do we need to indicate somehow that it is a long click?
                                this._registerClick(state);
                            }
                        }, this, true);
					} // if (state.left && this._longClick)
                    if (this._dnd && this._dnd._onButtonPress) {
                        this._dnd._onButtonPress(actor, event);
                    }
				} // if (!this._release) else
                _D('<');
                return true;
			} // if (state.left || state.right || state.middle)
		} // let (state)
        _D('<');
        return false;
	},

    _buttonReleaseEvent: function(actor, event) {
        _D('>' + this.__name__ + '._buttonReleaseEvent()');
		let (state = this._getState(event)) {
            if (state.left || state.right || state.middle) {
                if (state.left && this._timeout) this._timeout.remove('long-click');
                if (	this._state && state.left == this._state.left
                        && state.right == this._state.right && state.middle == this._state.middle) {
                    this._registerClick(state);
                    this._state = {};
                }
                _D('<');
                return true;
            } // if (state.left || state.right || state.middle)
		} // let (state)
        _D('<');
        return false;
	},

	_scrollEvent: function(actor, event) {
        _D('>' + this.__name__ + '._scrollEvent()');
		let (state = this._getStateScroll(event)) {
			if (state.scroll) {
                if (this._timeout) this._timeout.remove('long-click');
                this._state = {};
                this._callBack(state);
                _D('<');
                return true;
            }
		} // let (state)
        _D('<');
        return false;
	},

    _dndDrag: function() {
        _D('>' + this.__name__ + '._dndDrag()');
        let (state = { dnd: 1 }) {
            if (this._timeout) this._timeout.remove('long-click');
            this._state = {};
            this._callBack(state);
        } // let (state)
        _D('<');
    },

    _dndCancelled: function() {
        _D('>' + this.__name__ + '._dndCancelled()');
        let (state = { dnd: 2 }) {
            if (this._timeout) this._timeout.remove('long-click');
            this._state = {};
            this._callBack(state);
        } // let (state)
        _D('<');
    },

    _dndDrop: function() {
        _D('>' + this.__name__ + '._dndDrop()');
        let (state = { dnd: 3 }) {
            if (this._timeout) this._timeout.remove('long-click');
            this._state = {};
            this._callBack(state);
        } // let (state)
        _D('<');
    },

	_registerClick: function(state) {
        _D('>' + this.__name__ + '._registerClick()');
		let (stateNumber = this._getStateNumber(state)) {
			if (stateNumber) {
                if (!this._timeout || !this._timeout.remove(stateNumber)) { // first click
                    this._click(stateNumber, 1);
                    if (this._double) { // if double clicks
                        this._timeout.add(stateNumber, this._clicksTimeThreshold, null, null, true);
                    }
                }
                else { // second click
                    this._click(stateNumber, 2);
                }
			} // if (stateNumber)
		} // let (stateNumber)
        _D('<');
	},

    _click: function(stateNumber, clicks) {
        _D('>' + this.__name__ + '._click()');
        if (!stateNumber) {
            _D('<');
            return false;
        }
        let (state = this._getStateByNumber(stateNumber)) {
            state.clicks = clicks;
            this._callBack(state);
        } // let (state)
        _D('<');
        return false;
    },

	_callBack: function(state) {
        _D('>' + this.__name__ + '._callBack()');
		if (this._callback) {
			let (name = this._getStateVariable(state)) {
                if (this._scope) Lang.bind(this._scope, this._callback)(state, name);
                else this._callback(state, name);
			} // let (name)
		}
        _D('<');
	}
});
