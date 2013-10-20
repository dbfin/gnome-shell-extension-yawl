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
 * dbfinappbutton.js
 * Application button.
 *
 */

const Lang = imports.lang;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinClicked = Me.imports.dbfinclicked;
const dbFinConsts = Me.imports.dbfinconsts;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinSlicerIcon = Me.imports.dbfinslicericon;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

// GNOMENEXT: ui/panel.js: class AppMenuButton, ui/panelMenu.js: classes ButtonBox, Button
const dbFinAppButton = new Lang.Class({
	Name: 'dbFin.AppButton',
    Extends: PanelMenu.Button,

    _init: function(metaApp, trackerApp) {
        _D('>' + this.__name__ + '._init()');
		this.parent(0.0, null, true);
		this._signals = new dbFinSignals.dbFinSignals();
		this.metaApp = metaApp;
        this._trackerApp = trackerApp;

        this.hidden = false;
        this.hiding = false;

		// this.actor and this.container related stuff
        if (this.container) {
            this.container.add_style_class_name('panel-button-container');
        }
        if (this.actor) {
            this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
            this.actor.reactive = true;
        }

		this._minHPadding = 0;
		this._natHPadding = 0;
        this._signals.connectNoId({ emitter: this.actor, signal: 'style-changed',
                                    callback: this._styleChanged, scope: this },
                                  /*after = */true);

		// this._slicerIcon related stuff
		this._slicerIcon = new dbFinSlicerIcon.dbFinSlicerIcon();
        if (this._slicerIcon && this._slicerIcon.container) {
            if (this.actor) this.actor.add_child(this._slicerIcon.container);
            if (this._slicerIcon.actor) this._slicerIcon.actor._delegate = this;
            if (Main.panel && Main.panel.actor && Main.panel.actor.get_stage()) {
                this._slicerIcon.container.min_height = Main.panel.actor.get_height();
            }
        }

		this._icons = new dbFinArrayHash.dbFinArrayHash();

        this._clicked = null;
        this._updatedMouseScrollWorkspace =
        this._updatedMouseDragAndDrop =
		this._updatedMouseClickRelease =
        this._updatedMouseLongClick =
                this._updatedIconsDragAndDrop = function () {
			if (this._clicked) {
				this._clicked.destroy();
				this._clicked = null;
			}
            if (global.yawl && this._slicerIcon && this._slicerIcon.actor) {
                this._clicked = new dbFinClicked.dbFinClicked(this._slicerIcon.actor, this._buttonClicked, this, /*single = */true, /*doubleClicks = */true,
                                /*scroll = */!global.yawl._mouseScrollWorkspace, /*sendSingleClicksImmediately = */true,
                                /*dragAndDrop = */global.yawl._mouseDragAndDrop && global.yawl._iconsDragAndDrop,
                                /*clickOnRelease = */global.yawl._mouseClickRelease || global.yawl._mouseDragAndDrop,
                                /*longClick = */global.yawl._mouseLongClick);
            }
		};

        this._updatedIconsSize =
                this._updatedIconsFaded = this._updateIcon;
		this._updatedIconsClipBottom = function () { if (this._slicerIcon) this._slicerIcon.setClipBottom(global.yawl._iconsClipBottom); };
		this._updatedIconsDistance = function () { if (this._slicerIcon) this._slicerIcon.setPaddingH((global.yawl._iconsDistance + 1) >> 1); };
		this._updatedIconsAnimationTime = function () { if (this._slicerIcon) this._slicerIcon.animationTime = global.yawl._iconsAnimationTime; };
		this._updatedIconsAnimationEffect = function () { if (this._slicerIcon) this._slicerIcon.animationEffect = global.yawl._iconsAnimationEffect; };
		this._updatedIconsHoverAnimation = function () { if (this._slicerIcon) this._slicerIcon.hoverAnimation = global.yawl._iconsHoverAnimation; };
		this._updatedIconsHoverSize = function () { if (this._slicerIcon) this._slicerIcon.hoverScale = global.yawl._iconsHoverSize / 100.; };
		this._updatedIconsHoverOpacity = function () { if (this._slicerIcon) this._slicerIcon.setHoverOpacity100(global.yawl._iconsHoverOpacity); };
		this._updatedIconsHoverFit = function () { if (this._slicerIcon) this._slicerIcon.hoverFit = global.yawl._iconsHoverFit; };
		this._updatedIconsHoverAnimationTime = function () { if (this._slicerIcon) this._slicerIcon.hoverAnimationTime = global.yawl._iconsHoverAnimationTime; };
		this._updatedIconsHoverAnimationEffect = function () { if (this._slicerIcon) this._slicerIcon.hoverAnimationEffect = global.yawl._iconsHoverAnimationEffect; };

        global.yawl.watch(this);

		this.hide(0); // to set the width of this._slicerIcon to 0
		_D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
        if (this._clicked) {
            this._clicked.destroy();
            this._clicked = null;
        }
		if (this.container) {
			this.container.hide();
		}
		if (this.actor) {
			this.actor.reactive = false;
		}
        if (this._slicerIcon) {
			if (this.actor) this.actor.remove_child(this._slicerIcon.container);
			this._slicerIcon.destroy();
			this._slicerIcon = null;
		}
		if (this._icons) {
			this._icons.forEach(Lang.bind(this, function(size, icon) { this._icons.set(size, null); icon.destroy(); }));
			this._icons.destroy();
			this._icons = null;
		}
		this._bindReactiveId = null;
		this.hidden = true;
		this._trackerApp = null;
		this.metaApp = null;
		this.parent();
        this.emit('destroy');
        _D('<');
	},

    show: function(time) {
        _D('>' + this.__name__ + '.show()');
		if (this.container) {
			this.container.show();
			this.container.reactive = true;
		}
		this.hidden = false;
        this.hiding = false;
		if (this._slicerIcon) this._slicerIcon.show(time);
        _D('<');
    },

    hide: function(time) {
        _D('>' + this.__name__ + '.hide()');
		if (this._slicerIcon) {
            this.hiding = true;
            this._slicerIcon.hide(time, function () {
                                            if (this.container) {
                                                this.container.reactive = false;
                                                this.container.hide();
                                            }
                                            this.hidden = true;
                                            this.hiding = false;
                                        }, this);
        }
        _D('<');
    },

	_updateIcon: function() {
        _D('>' + this.__name__ + '._updateIcon()');
		if (!this.metaApp || !this._slicerIcon) {
			_D(!this.metaApp ? 'this.metaApp === null' : 'this._slicerIcon === null');
			_D('<');
			return;
		}
        global.yawl._iconsSize = global.yawl._iconsSize ? Math.floor((global.yawl._iconsSize + 4) / 8) * 8 : 24; // sizes are 16, 24, ..., 128
		let (   icon = this._slicerIcon.getIcon(),
                iconnew = this._icons ? this._icons.get(global.yawl._iconsFaded ? -global.yawl._iconsSize : global.yawl._iconsSize) : null) {
            if (!iconnew) {
                if (global.yawl._iconsFaded) {
                    // returns NULL sometimes
                    iconnew = this.metaApp.get_faded_icon(global.yawl._iconsSize,
                            Main.panel && Main.panel.actor && Main.panel.actor.text_direction || 0);
                }
                if (!iconnew) iconnew = this.metaApp.create_icon_texture(global.yawl._iconsSize);
                if (iconnew) this._icons.set(global.yawl._iconsFaded ? -global.yawl._iconsSize : global.yawl._iconsSize, iconnew);
            }
            if (iconnew && iconnew != icon) this._slicerIcon.setIcon(iconnew);
		} // let (icon, iconnew)
        _D('<');
	},

	_styleChanged: function() {
        _D('@' + this.__name__ + '._styleChanged()');
		this._minHPadding = 0;
		this._natHPadding = 0;
        _D('<');
	},

	_buttonClicked: function(state, name) {
        _D('>' + this.__name__ + '._buttonClicked()');
        if (!this._trackerApp) {
            _D('this._trackerApp === null');
            _D('<');
            return;
        }
        if (!name || name == '' || (!state.scroll && !state.dnd && (!state.clicks || state.clicks < 1))) {
            _D('<');
            return;
        }
        if (state.dnd) {
            if (this._trackerApp) {
                switch (state.dnd) {
                    case 1: // drag
				        if (this.menu && this.menu.isOpen) this.menu.close();
                        if (this.menuWindows && this.menuWindows.isOpen) this.menuWindows.close();
                        this._dragging = true;
                        break;
                    case 2: // cancelled or drop
                    case 3:
                        if (this._dragging) {
                            this._dragging = false;
				            this._trackerApp.hideWindowsGroup(0);
                            this._trackerApp.updateVisibility();
                        }
                        break;
                    default:
                        break;
                }
            }
            _D('<');
            return;
        }
        if (!state.scroll && state.clicks > 2) {
            state.clicks = 2;
        }
        let (functionIndex =  global.yawl && global.yawl['_mouseApp' + name]) {
            if (functionIndex) { // functionIndex === 0 is default corresponding to no action
                let (functionRow = dbFinConsts.arrayAppClickFunctions[functionIndex]) {
					if (state.scroll) state.clicks = state.up ? 1 : 2;
                    if (functionRow.length && functionRow.length > state.clicks) {
                        let (functionName = functionRow[state.clicks]) {
                            if (functionName != '' && this._trackerApp[functionName]) {
								this._trackerApp.hideWindowsGroup();
								if (this.menu && this.menu.isOpen && functionName !== 'openMenu') this.menu.close();
                                if (this.menuWindows && this.menuWindows.isOpen
                                    && functionName !== 'nextWindowNonMinimized'
                                    && functionName !== 'nextWindow') this.menuWindows.close();
                                Lang.bind(this._trackerApp, this._trackerApp[functionName])();
                            }
                        } // let (functionName)
                    } // if (functionRow.length && functionRow.length > state.clicks)
                } // let (functionRow)
            } // if (functionIndex)
        } // let (functionIndex)
        _D('<');
	},

	_onButtonPress: function() {
		// nothing to do here
	}
});
