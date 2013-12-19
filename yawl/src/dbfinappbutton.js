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
 * dbfinappbutton.js
 * Application button.
 *
 */

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinAnimation = Me.imports.dbfinanimation;
const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinClicked = Me.imports.dbfinclicked;
const dbFinConsts = Me.imports.dbfinconsts;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinSlicerIcon = Me.imports.dbfinslicericon;
const dbFinUtils = Me.imports.dbfinutils;

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
            this._signals.connectNoId({	emitter: this.container, signal: 'enter-event',
                                        callback: function (actor) { if (this._slicerIcon) this._slicerIcon.hoverEnter(actor); }, scope: this });
            this._signals.connectNoId({	emitter: this.container, signal: 'leave-event',
                                        callback: function (actor) { if (this._slicerIcon) this._slicerIcon.hoverLeave(actor); }, scope: this });
        }
        if (this.actor) {
            this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
            this.actor.reactive = true;
            this.actor._delegate = this;
            this.actor.x_align = Clutter.ActorAlign.CENTER;
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
/*            if (Main.panel && Main.panel.actor && Main.panel.actor.get_stage()) {
                this._slicerIcon.container.min_height = Main.panel.actor.get_height();
            }*/
        }

		this._icons = new dbFinArrayHash.dbFinArrayHash();

        this._clicked = null;
        this._updatedMouseScrollWorkspace =
                this._updatedMouseDragAndDrop =
                this._updatedMouseClickRelease =
                this._updatedMouseLongClick =
                this._updatedMouseScrollTimeout =
                this._updatedMouseClicksTimeThreshold =
                this._updatedIconsDragAndDrop = function () {
			if (this._clicked) {
				this._clicked.destroy();
				this._clicked = null;
			}
            if (global.yawl && this.actor) {
                this._clicked = new dbFinClicked.dbFinClicked(this.actor, this._buttonClicked, this, /*single = */true, /*doubleClicks = */true,
                                /*scroll = */!global.yawl._mouseScrollWorkspace,
                                /*dragAndDrop = */global.yawl._mouseDragAndDrop && global.yawl._iconsDragAndDrop,
                                /*clickOnRelease = */global.yawl._mouseClickRelease || global.yawl._mouseDragAndDrop,
                                /*longClick = */global.yawl._mouseLongClick,
                                /*clicksTimeThreshold = */global.yawl._mouseClicksTimeThreshold,
                                /*scrollTimeout = */global.yawl._mouseScrollTimeout);
            }
		};

        this._badges = new dbFinArrayHash.dbFinArrayHash();

        this._updatedIconsSize =
                this._updatedIconsFaded = this._updateIcon;
		this._updatedIconsClipTop = function () { if (global.yawl && this._slicerIcon) this._slicerIcon.setClipTop(global.yawl._iconsClipTop); };
		this._updatedIconsClipBottom = function () {
            if (global.yawl && this._slicerIcon) this._slicerIcon.setClipBottom(global.yawl._iconsClipBottom);
            this._updatePivotPoint();
            if (this._trackerApp) this._trackerApp.updateBadges();
        };
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
        if (this._badges) {
            this._badges.forEach(Lang.bind(this, function(name, actor) { if (name) this.badgeRemove(name); }));
            this._badges.destroy();
            this._badges = null;
        }
		this._bindReactiveId = null;
		this.hidden = true;
		this._trackerApp = null;
		this.metaApp = null;
		this.parent();
        this.emit('destroy');
        _D('<');
	},

    _allocate: function(actor, box, flags) {
        _D('@' + this.__name__ + '._allocate()');
        this.parent(actor, box, flags);
        if (this._badges) {
            let (w = box.x2 - box.x1,
                 h = box.y2 - box.y1,
                 boxChild = new Clutter.ActorBox()) {
                this._badges.forEach(Lang.bind(this, function (name, actor) {
                    if (!actor) return;
                    let ([ wm, wn ] = actor.get_preferred_width(-1),
                         [ hm, hn ] = actor.get_preferred_height(-1),
                         align = actor._align || 0) {
                        let (x, y) {
                            if (!(align & 5)) {
                                y = Math.floor(box.y1 + h * actor._badgePositionY + actor._badgeShiftY - hn / 2);
                            }
                            else if (align & 1) {
                                y = box.y1 + actor._badgeShiftY;
                                if (align & 4) hn = h;
                            }
                            else {
                                y = box.y2 - hn + actor._badgeShiftY;
                            }
                            if (!(align & 10)) {
                                x = Math.floor(box.x1 + w * actor._badgePositionX + actor._badgeShiftX - wn / 2);
                            }
                            else if (align & 8) {
                                x = box.x1 + actor._badgeShiftX;
                                if (align & 2) wn = w;
                            }
                            else {
                                x = box.x2 - wn + actor._badgeShiftX;
                            }
                            dbFinUtils.setBox(boxChild, x, y, x + wn, y + hn);
                            actor.allocate(boxChild, flags);
                        } // let (x, y)
                    } // let ([ wm, wn ], [ hm, hn ], align)
                })); // this._badges.forEach(name, actor)
            } // let (w, h, boxChild)
        } // if (this._badges)
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

    _updatePivotPoint: function() {
        _D('>' + this.__name__ + '._updatePivotPoint()');
        if (this._slicerIcon && this._slicerIcon.actor) {
            this._slicerIcon.actor.set_pivot_point(
                    0.5,
                    global.yawl
                        && global.yawl._iconsSize
                        && global.yawl._iconsClipBottom
                    ? 0.5 * (1 - global.yawl._iconsClipBottom / global.yawl._iconsSize)
                    : 0.5
            );
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
            if (iconnew && iconnew != icon) {
                this._slicerIcon.setIcon(iconnew);
                this._updatePivotPoint();
                if (this._trackerApp) this._trackerApp.updateVisibility();
            }
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
                        if (this._slicerIcon) this._slicerIcon.hoverLeaveAll();
                        this._trackerApp.hideWindowsGroup(0);
                        this._trackerApp.updateVisibility();
                    }
                    break;
                default:
                    break;
            } // switch (state.dnd)
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
                                    && !/^nextWindow/.test(functionName)) this.menuWindows.close();
                                Lang.bind(this._trackerApp, this._trackerApp[functionName])(state);
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
	},

    getDragActor: function() {
        _D('>' + this.__name__ + '.getDragActor()');
        let (icon = this.metaApp && this.metaApp.create_icon_texture(
                    Math.round(global.yawl && global.yawl._iconsSize || 24)
             )) {
            if (icon) {
                icon.opacity = 128;
                icon.scale_x = this._slicerIcon && this._slicerIcon.getZoom() || 1.0;
                icon.scale_y = this._slicerIcon && this._slicerIcon.getZoom() || 1.0;
                _D('<');
                return icon;
            }
            _D('<');
            return this.actor;
        }
    },

    getDragActorSource: function() {
        _D('>' + this.__name__ + '.getDragActorSource()');
        _D('<');
        return this.container || undefined;
    },

    // Parameters:
    //      name: a string or a number
    //      actor: Clutter.Actor
    //      align: bits from right-to-left == top, right, bottom, left
    //      positionX, positionY: if not aligned, x- and y- positions from 0.0 to 1.0
    //      shiftX, shiftY: x-, y- shift
    badgeAdd: function(name, actor, align, positionX, positionY, shiftX, shiftY) {
        _D('>' + this.__name__ + '.badgeAdd()');
        if (!name && name !== 0 || typeof name != 'string' && typeof name != 'number'
            || !(actor instanceof Clutter.Actor)
            || !this._badges) {
            _D('<');
            return;
        }
        actor._align = dbFinUtils.inRange(parseInt(align), undefined, undefined, undefined);
        actor._badgePositionX = dbFinUtils.inRange(parseFloat(positionX), undefined, undefined, 0.0);
        actor._badgePositionY = dbFinUtils.inRange(parseFloat(positionY), undefined, undefined, 0.0);
        actor._badgeShiftX = dbFinUtils.inRange(parseFloat(shiftX), undefined, undefined, 0.0);
        actor._badgeShiftY = dbFinUtils.inRange(parseFloat(shiftY), undefined, undefined, 0.0);
        this._badges.set(name, actor);
        if (this.actor) this.actor.add_child(actor);
        this.badgeHide(name, 0);
        _D('<');
    },

    badgeRemove: function(name) {
        _D('>' + this.__name__ + '.badgeRemove()');
        let (actor = ( name || name === 0 )
                     && this._badges
                     && this._badges.remove(name)
                     || undefined) {
            if (actor) {
                if (this.actor) this.actor.remove_child(actor);
            }
        }
        _D('<');
    },

    badgeShow: function(name, time) {
        _D('>' + this.__name__ + '.badgeShow()');
        let (actor = ( name || name === 0 )
                     && this._badges
                     && this._badges.get(name)
                     || undefined) {
            if (actor) {
                actor.show();
                dbFinAnimation.animateToState(actor, { opacity: 255 }, null, null,
                                              !isNaN(time = parseFloat(time))
                                              ? time
                                              : this._slicerIcon && this._slicerIcon.animationTime || 0);
            }
        }
        _D('<');
    },

    badgeHide: function(name, time) {
        _D('>' + this.__name__ + '.badgeHide()');
        let (actor = ( name || name === 0 )
                     && this._badges
                     && this._badges.get(name)
                     || undefined) {
            if (actor) {
                dbFinAnimation.animateToState(actor, { opacity: 0 }, function () {
                                                  actor.hide();
                                              }, this,
                                              !isNaN(time = parseFloat(time))
                                              ? time
                                              : this._slicerIcon && this._slicerIcon.animationTime || 0);
            }
        }
        _D('<');
    },

    badgeShift: function(name, shiftX, shiftY) {
        _D('>' + this.__name__ + '.badgeShift()');
        let (actor = ( name || name === 0 )
                     && this._badges
                     && this._badges.get(name)
                     || undefined) {
            if (actor) {
                if (shiftX !== undefined) actor._badgeShiftX = dbFinUtils.inRange(parseFloat(shiftX), undefined, undefined, 0.0);
                if (shiftY !== undefined) actor._badgeShiftY = dbFinUtils.inRange(parseFloat(shiftY), undefined, undefined, 0.0);
                actor.queue_relayout();
            }
        }
        _D('<');
    }
});
