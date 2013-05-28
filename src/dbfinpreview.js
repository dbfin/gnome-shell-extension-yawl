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
 * dbfinpreview.js
 * Preview window.
 *
 */

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const LookingGlass = imports.ui.lookingGlass;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinAnimation = Me.imports.dbfinanimation;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinStyle = Me.imports.dbfinstyle;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

const dbFinPreview = new Lang.Class({
	Name: 'dbFin.Preview',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
        this._signals = new dbFinSignals.dbFinSignals();
		this._window = null;
		this._compositor = null;
        this.animationTime = 0;
        this._dimColor = '#000000';
        this._dimOpacity = 0;
		this.container = new Shell.GenericContainer({ name: 'yawlWindowPreview', reactive: false, visible: false });
		if (this.container) {
			if (Main.uiGroup) Main.uiGroup.add_actor(this.container);
            this._signals.connectNoId({ emitter: this.container, signal: 'get-preferred-width',
                                        callback: this._getPreferredWidth, scope: this });
            this._signals.connectNoId({ emitter: this.container, signal: 'get-preferred-height',
                                        callback: this._getPreferredHeight, scope: this });
            this._signals.connectNoId({ emitter: this.container, signal: 'allocate',
                                        callback: this._allocate, scope: this });
		}
		this._background = new St.Bin({ reactive: false, visible: true, opacity: 0 });
		if (this._background) {
			if (this.container) this.container.add_actor(this._background);
			this._backgroundStyle = new dbFinStyle.dbFinStyle(this._background);
		}
		this._clone = new Clutter.Clone({ reactive: false, visible: true });
		if (this._clone) {
			if (this.container) this.container.add_actor(this._clone);
		}
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
        this.hide();
		if (this._backgroundStyle) {
			this._backgroundStyle.destroy();
			this._backgroundStyle = null;
		}
        if (this._background) {
            this._background.destroy();
            this._background = null;
        }
        if (this._clone) {
            this._clone.destroy();
            this._clone = null;
        }
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
		this._window = null;
		this._compositor = null;
        _D('<');
	},

    _getPreferredWidth: function(actor, forHeight, alloc) {
        _D('@' + this.__name__ + '._getPreferredWidth()');
		[ alloc.min_size, alloc.natural_size ] = [ global.screen_width, global.screen_width ];
        _D('<');
    },

    _getPreferredHeight: function(actor, forWidth, alloc) {
        _D('@' + this.__name__ + '._getPreferredHeight()');
        [ alloc.min_size, alloc.natural_size ] = [ global.screen_height, global.screen_height ];
        _D('<');
    },

    _allocate: function(actor, box, flags) {
        _D('@' + this.__name__ + '._allocate()');
		if (!this.container || !this.container.get_stage() || !this._clone) {
			_D('<');
			return;
		}
		if (this._background) this._background.allocate(box, flags);
        let (	x = box.x1 + (this._cloneX || 0),
                y = box.y1 + (this._cloneY || 0),
                boxChild = new Clutter.ActorBox()) {
            dbFinUtils.setBox(boxChild, x, y, x + (this._cloneWidth || 0), y + (this._cloneHeight || 0));
            this._clone.allocate(boxChild, flags);
        } // let (x, y, boxChild)
        _D('<');
    },

	_update: function() {
        _D('>' + this.__name__ + '._update()');
		if (this._clone && this._compositor) {
			let (texture = this._compositor.get_texture()) {
				let (size = texture && texture.get_size && texture.get_size()) {
					if (size && size[0] && size[0] > 0 && size[1] && size[1] > 0) {
						this._clone.set_source(texture);
						this._cloneWidth = size[0];
						this._cloneHeight = size[1];
						this._clone.set_size(this._cloneWidth, this._cloneHeight);
					}
				}
			}
			let (xy = this._compositor.get_position()) {
                this._cloneX = xy[0];
                this._cloneY = xy[1];
                this._clone.set_position(this._cloneX, this._cloneY);
			}
		}
        _D('<');
	},

	show: function(trackerWindow, time/* = null*/) {
        _D('>' + this.__name__ + '.show()');
		if (time === undefined || time === null) time = this.animationTime || 0;
		this.hide(time);
		if (this.container && this._clone && trackerWindow && trackerWindow.hovered) {
			let (compositor = trackerWindow.metaWindow
							&& trackerWindow.metaWindow.get_compositor_private
							&& trackerWindow.metaWindow.get_compositor_private()) {
				if (compositor) {
					this._window = trackerWindow.metaWindow;
					this._compositor = compositor;
					this._update();
					if (this._signals) {
						this._signals.connectId('clone-resize', {	emitter: this._compositor, signal: 'size-changed',
																	callback: this._update, scope: this });
					}
					this.container.show();
                    this._clone.show();
					dbFinAnimation.animateToState(this._background, { opacity: 255 }, null, null, time);
				}
				else {
					this._window = null;
					this._compositor = null;
				}
			}
		}
        _D('<');
	},

	hide: function(trackerWindow/* = any*/, time/* = null*/) {
        _D('>' + this.__name__ + '.hide()');
		if (time === undefined || time === null) time = this.animationTime || 0;
		if (this._clone && (!trackerWindow || trackerWindow.metaWindow == this._window)) {
			if (this._signals) this._signals.disconnectId('clone-resize');
            this._clone.hide();
            dbFinAnimation.animateToState(this._background, { opacity: 0 }, function () {
                this.container.hide();
            }, this, time);
		}
        _D('<');
	},

    _updateBackgroundStyle: function() {
        _D('>' + this.__name__ + '._updateBackgroundStyle()');
        if (!this._backgroundStyle || !this._background || !this._background.get_stage()) {
            _D('<');
            return;
        }
        let (style = {},
             color = dbFinUtils.stringColorOpacity100ToStringRGBA(this._dimColor, this._dimOpacity)) {
            style['background-color'] = color;
            this._backgroundStyle.set(style);
        }
        _D('<');
    },

    get dimColor() { return this._dimColor; },
    set dimColor(color) {
        if (color && this._dimColor != color) {
            this._dimColor = color;
            this._updateBackgroundStyle();
        }
    },
    get dimOpacity() { return this._dimOpacity; },
    set dimOpacity(opacity) {
        if (!isNaN(opacity = parseInt(opacity)) && this._dimOpacity != opacity) {
            this._dimOpacity = opacity;
            this._updateBackgroundStyle();
        }
    }
});
