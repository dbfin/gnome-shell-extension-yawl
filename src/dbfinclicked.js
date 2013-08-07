/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 *
 * Copyright (C) 2013 Vadim Cherepanov @ dbFin <vadim@dbfin.com>
 *
 * Yet Another Window List (YAWL) Gnome-Shell extension is
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
const Mainloop = imports.mainloop;

const Clutter = imports.gi.Clutter;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinSignals = Me.imports.dbfinsignals;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinClicked = new Lang.Class({
	Name: 'dbFin.Clicked',

	/* callback(state, variable):       state == { left:, right:, middle:, ctrl:, shift:, clicks:, scroll:, up: }
	 *	 					            where left, right, middle, ctrl, shift, scroll, up are either true or false
	 * 									clicks is the number of clicks
	 *									variable is a string of the form
	 *									'Left/Right/Middle[Ctrl][Shift]' or 'Scroll'
	 */
    _init: function(emitter, callback, scope, doubleClicks/* = false*/, scroll/* = false*/,
                    sendSingleClicksImmediately/* = false*/, clickOnRelease/* = false*/, longClick/* = false*/) {
        _D('>' + this.__name__ + '._init()');
        this._signals = new dbFinSignals.dbFinSignals();
		this._emitter = emitter;
		this._callback = callback;
		this._scope = scope;
        this._scroll = !!scroll;
		this._double = !!doubleClicks;
		this._single = !!sendSingleClicksImmediately;
		this._release = !!clickOnRelease;
        this._longClick = this._release && !!longClick;
		this._state = {};
		this._stateTimeouts = new dbFinArrayHash.dbFinArrayHash();
        for (let stateNumber = 0; stateNumber < 16; ++stateNumber) this._stateTimeouts.set(stateNumber, null);
		this._timeoutLongClick = null;

		this._signals.connectNoId({	emitter: this._emitter, signal: 'button-press-event',
								  	callback: this._buttonPressEvent, scope: this });
		if (this._release) {
			this._signals.connectNoId({	emitter: this._emitter, signal: 'button-release-event',
									  	callback: this._buttonReleaseEvent, scope: this });
		}
        if (this._scroll) {
            this._signals.connectNoId({	emitter: this._emitter, signal: 'scroll-event',
                                        callback: this._scrollEvent, scope: this });
        }
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
		if (this._timeoutLongClick) {
			Mainloop.source_remove(this._timeoutLongClick);
			this._timeoutLongClick = null;
		}
		if (this._stateTimeouts) {
			this._stateTimeouts.forEach(function (stateNumber, timeout) {
				if (timeout) Mainloop.source_remove(timeout);
            });
			this._stateTimeouts.destroy();
			this._stateTimeouts = null;
		}
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
		     direction = event.get_scroll_direction()) {
			if (direction === Clutter.ScrollDirection.UP
					|| direction === Clutter.ScrollDirection.DOWN) {
				state.left = false;
				state.right = false;
				state.middle = false;
				state.scroll = true;
				state.up = direction === Clutter.ScrollDirection.UP;
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
			} // if (state.left || state.right || state.middle)
			else if (state.scroll) {
				key = 'scroll';
			} // if (state.left || state.right || state.middle) else if (state.scroll)
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
			} // if (state.left || state.right || state.middle)
			else if (state.scroll) {
				name = 'Scroll';
			} // if (state.left || state.right || state.middle) else if (state.scroll)
			_D('<');
			return name;
		} // let (name)
	},

    _buttonPressEvent: function(actor, event) {
        _D('>' + this.__name__ + '._buttonPressEvent()');
		let (state = this._getState(event)) {
            if (state.left || state.right || state.middle) {
				if (this._timeoutLongClick) {
					Mainloop.source_remove(this._timeoutLongClick);
					this._timeoutLongClick = null;
				}
				if (!this._release) {
					this._registerClick(state);
				}
				else {
					// do not care about modifiers so far
					this._state = {};
					this._state.left = state.left;
					this._state.right = state.right;
					this._state.middle = state.middle;
					if (state.left && this._longClick) {
						this._timeoutLongClick = Mainloop.timeout_add(
								Math.max(1000, global.yawl._mouseClicksTimeThreshold * 2),
						        Lang.bind(this, function () {
									let (timeout = this._timeoutLongClick,
										 state = {},
									     [ x, y, m ] = global.get_pointer()) {
										this._timeoutLongClick = null;
										if (!timeout) return; // something already cancelled timeout?
										Mainloop.source_remove(timeout);
										this._state = {};
										state.right = true;
										state.ctrl = !!(m & Clutter.ModifierType.CONTROL_MASK);
										state.shift = !!(m & Clutter.ModifierType.SHIFT_MASK);
										// do we need to indicate somehow that it is a long click?
										this._registerClick(state);
									}
								})
						);
					} // if (state.left && this._longClick)
				} // if (!this._release) else
			} // if (state.left || state.right || state.middle)
		} // let (state)
        _D('<');
	},

    _buttonReleaseEvent: function(actor, event) {
        _D('>' + this.__name__ + '._buttonReleaseEvent()');
		let (state = this._getState(event)) {
            if (state.left && this._timeoutLongClick) {
				Mainloop.source_remove(this._timeoutLongClick);
				this._timeoutLongClick = null;
			}
			if (	this._state && state.left == this._state.left
			    	&& state.right == this._state.right && state.middle == this._state.middle) {
				this._registerClick(state);
				this._state = {};
			}
		} // let (state)
        _D('<');
	},

	_scrollEvent: function(actor, event) {
        _D('>' + this.__name__ + '._scrollEvent()');
		let (state = this._getStateScroll(event)) {
			if (state.scroll) this._callBack(state);
		} // let (state)
        _D('<');
	},

	_registerClick: function(state) {
        _D('>' + this.__name__ + '._registerClick()');
		let (stateNumber = this._getStateNumber(state)) {
			if (stateNumber) {
				let (timeout = this._stateTimeouts.get(stateNumber)) {
					if (!timeout) { // first click
						if (this._single || !this._double) { // if send first click immediately or if no double clicks
							this._onTimeout(stateNumber, 1);
						}
						if (this._double) { // if double clicks
							timeout = Mainloop.timeout_add(global.yawl._mouseClicksTimeThreshold, Lang.bind(this, function() {
								Lang.bind(this, this._onTimeout)(stateNumber, this._single ? 0 : 1);
							}));
							this._stateTimeouts.set(stateNumber, timeout);
						}
					}
					else { // second click
	                    this._stateTimeouts.set(stateNumber, null);
						Mainloop.source_remove(timeout);
						this._onTimeout(stateNumber, 2);
					} // if (!timeout) else
				} // let (timeout)
			} // if (stateNumber)
		} // let (stateNumber)
        _D('<');
	},

    _onTimeout: function(stateNumber, clicks) {
        _D('>' + this.__name__ + '._onTimeout()');
        if (!stateNumber) {
            _D('<');
            return false;
        }
		// coming here should be:
		// 	this._double	this._single	clicks	timeout
		//	false			?				1		-
		//	true			false			1		+
		//									2		-
		//					true			0		+
		//									1		-
		//									2		-
        let (timeout = this._stateTimeouts.get(stateNumber)) {
			if (this._double && !this._single && clicks == 1 && !timeout) { // got called after receiving second click
				_D('<');
				return false;
			}
			if (timeout) this._stateTimeouts.set(stateNumber, null);
			if (clicks) {
				let (state = this._getStateByNumber(stateNumber)) {
					state.clicks = clicks;
					this._callBack(state);
				} // let (state)
			} // if (clicks)
        } // let (timeout)
        _D('<');
        return false;
    },

	_callBack: function(state) {
        _D('>' + this.__name__ + '._callBack()');
		if (this._callback) {
			let (name = this._getStateVariable(state),
                 time = global.get_current_time()) {
				if (time) global.yawl._bugfixClickTime = time;
				Mainloop.timeout_add(33, Lang.bind(this, function() {
					if (this._scope) Lang.bind(this._scope, this._callback)(state, name);
					else this._callback(state, name);
				}));
			} // let (name)
		}
        _D('<');
	}
});
