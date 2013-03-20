/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinappbutton.js
 * Application button.
 *
 */

const Lang = imports.lang;

const Shell = imports.gi.Shell;
const St = imports.gi.St;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
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
        this._settings = Convenience.getSettings();
		this._signals = new dbFinSignals.dbFinSignals();
		this.metaApp = metaApp;
        this._trackerApp = trackerApp;

		// this.actor and this.container related stuff
        this.actor._delegate = this;

        this.hidden = false;
        this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
        this.actor.reactive = true;

		this._minHPadding = 0;
		this._natHPadding = 0;
        this._signals.connectNoId({ emitter: this.actor, signal: 'style-changed',
                                    callback: this._styleChanged, scope: this },
                                  /*after = */true);

		this._signals.connectNoId({	emitter: this.actor, signal: 'enter-event',
									callback: this._hoverEnter, scope: this });
		this._signals.connectNoId({	emitter: this.actor, signal: 'leave-event',
									callback: this._hoverLeave, scope: this });

        this._clicked = null;
		dbFinUtils.settingsVariable(this, 'mouse-click-release', false, null, function () {
			if (this._clicked) {
				this._clicked.destroy();
				this._clicked = null;
			}
			this._clicked = new dbFinClicked.dbFinClicked(this.actor, this._buttonClicked, this, /*doubleClicks = */true,
							/*scroll = */true, /*sendSingleClicksImmediately = */true, /*clickOnRelease = */this._mouseClickRelease);
		});

		// this._slicerIcon related stuff
		this._slicerIcon = new dbFinSlicerIcon.dbFinSlicerIcon();
		this.actor.add_actor(this._slicerIcon.actor);
        if (Main.panel && Main.panel.actor) this._slicerIcon.actor.min_height = Main.panel.actor.get_height();

		this._icons = new dbFinArrayHash.dbFinArrayHash();

        dbFinUtils.settingsVariable(this, 'icons-size', 48, { min: 16, max: 128 }, this._updateIcon);
        dbFinUtils.settingsVariable(this, 'icons-faded', true, null, this._updateIcon);
        dbFinUtils.settingsVariable(this, 'icons-opacity', 84, { min: 50, max: 100 }, function () {
            if (this._slicerIcon) this._slicerIcon.animateToState({ opacity: dbFinUtils.opacity100to255(this._iconsOpacity) });
        });
		dbFinUtils.settingsVariable(this, 'icons-clip-top', 3, { min: 0, max: 11 }, function () {
            if (this._slicerIcon) this._slicerIcon.setClipTop(this._iconsClipTop);
        });
		dbFinUtils.settingsVariable(this, 'icons-clip-bottom', 3, { min: 0, max: 11 }, function () {
            if (this._slicerIcon) this._slicerIcon.setClipBottom(this._iconsClipBottom);
        });
		dbFinUtils.settingsVariable(this, 'icons-distance', 21, { min: 0, max: 100 }, function () {
    		if (this._slicerIcon) this._slicerIcon.setPaddingH((this._iconsDistance + 1) >> 1);
        });
		dbFinUtils.settingsVariable(this, 'icons-animation-time', 490, { min: 0, max: 3000 }, function () {
    		if (this._slicerIcon) this._slicerIcon.animationTime = this._iconsAnimationTime;
        });
		dbFinUtils.settingsVariable(this, 'icons-animation-effect', 1, { min: 0 }, function () {
    		if (this._slicerIcon) this._slicerIcon.animationEffect = this._iconsAnimationEffect;
        });
		dbFinUtils.settingsVariable(this, 'icons-hover-animation', true);
		dbFinUtils.settingsVariable(this, 'icons-hover-size', 100, { min: 100, max: 200 });
		dbFinUtils.settingsVariable(this, 'icons-hover-opacity', 100, { min: 50, max: 100 });
		dbFinUtils.settingsVariable(this, 'icons-hover-fit', false);
		dbFinUtils.settingsVariable(this, 'icons-hover-animation-time', 33, { min: 0, max: 100 });
		dbFinUtils.settingsVariable(this, 'icons-hover-animation-effect', 0, { min: 0 });

		this.hide(); // to set the width of this._slicerIcon to 0

        // this and this.metaApp related stuff
		this._menuManager = Main.panel && Main.panel.menuManager || null;
		this._updateMenu();
		if (this.metaApp) {
			this._signals.connectNoId({	emitter: this.metaApp, signal: 'notify::menu',
										callback: this._update, scope: this });
			this._signals.connectNoId({	emitter: this.metaApp, signal: 'notify::action-group',
										callback: this._update, scope: this });
		}
		this._signals.connectNoId({ emitter: Shell.AppSystem.get_default(), signal: 'app-state-changed',
									callback: this._updateAppState, scope: this });
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
            this.actor._delegate = null;
		}
        if (this._slicerIcon) {
			if (this.actor) this.actor.remove_actor(this._slicerIcon.actor);
			this._slicerIcon.destroy();
			this._slicerIcon = null;
		}
		if (this.container) {
			if (this.container.get_parent) {
				let (box = this.container.get_parent()) {
					if (box && box.remove_actor) box.remove_actor(this.container);
				}
			}
		}
		if (this._icons) {
			this._icons.forEach(Lang.bind(this, function(size, icon) { this._icons.set(size, null); icon.destroy(); }));
			this._icons.destroy();
			this._icons = null;
		}
        this._menuManager = null;
		this._bindReactiveId = null;
		this.hidden = true;
		this._trackerApp = null;
		this.metaApp = null;
		this._settings = null;
		this.parent();
        _D('<');
	},

    show: function(time) {
        _D('>' + this.__name__ + '.show()');
		if (this.container) {
			this.container.show();
			this.container.reactive = true;
		}
		this.hidden = false;
		if (this._slicerIcon) this._slicerIcon.animateToState({	opacity: this._iconsOpacity ? dbFinUtils.opacity100to255(this._iconsOpacity) : 255,
																natural_width: this._slicerIcon.getNaturalWidth() }, null, null, time);
        _D('<');
    },

    hide: function(time) {
        _D('>' + this.__name__ + '.hide()');
		if (this.container) {
			this.container.reactive = false;
		}
		if (this._slicerIcon) this._slicerIcon.animateToState({	opacity: 0, natural_width: 0, min_width: 0 },
		                                                      	function () { if (this.container) this.container.hide(); this.hidden = true; },
		                                                      	this,
                                                                time);
        _D('<');
    },

	_hoverEnter: function() {
        _D('>' + this.__name__ + '._hoverEnter()');
		if (this._iconsHoverAnimation && this._slicerIcon) {
			let (state = {}) {
				if (this._iconsHoverOpacity) state.opacity = dbFinUtils.opacity100to255(this._iconsHoverOpacity);
				if (this._iconsHoverSize) state.scale_x = state.scale_y = this._iconsHoverSize / 100.;
				if (this._iconsHoverFit) state.min_width = this._slicerIcon.getNaturalWidth();
				this._slicerIcon.animateToState(state, null, null,
                                                this._iconsAnimationTime && this._iconsHoverAnimationTime
                                                        ? Math.floor(this._iconsAnimationTime * this._iconsHoverAnimationTime / 100)
                                                        : 0,
                                                this._iconsHoverAnimationEffect);
			}
		}
        this.emit('enter-event');
        _D('<');
	},

	_hoverLeave: function() {
        _D('>' + this.__name__ + '._hoverLeave()');
		if (this._slicerIcon) {
			let (state = {}) {
				if (this._iconsOpacity) state.opacity = dbFinUtils.opacity100to255(this._iconsOpacity);
				state.scale_x = state.scale_y = 1.;
                state.min_width = 0;
				this._slicerIcon.animateToState(state, null, null,
                                                this._iconsAnimationTime && this._iconsHoverAnimationTime
                                                        ? Math.floor(this._iconsAnimationTime * this._iconsHoverAnimationTime / 100)
                                                        : 0,
                                                this._iconsHoverAnimationEffect);
			}
		}
        this.emit('leave-event');
        _D('<');
	},

	_updateIcon: function() {
        _D('>' + this.__name__ + '._updateIcon()');
		if (!this.metaApp || !this._slicerIcon) {
			_D(!this.metaApp ? 'this.metaApp === null' : 'this._slicerIcon === null');
			_D('<');
			return;
		}
        this._iconsSize = this._iconsSize ? Math.floor((this._iconsSize + 4) / 8) * 8 : 48; // sizes are 16, 24, ..., 128
		let (   icon = this._slicerIcon._icon,
                iconnew = this._icons ? this._icons.get(this._iconsFaded ? -this._iconsSize : this._iconsSize) : null) {
            if (iconnew === undefined || !iconnew) {
                if (this._iconsFaded) iconnew = this.metaApp.get_faded_icon(this._iconsSize); // returns NULL sometimes
                if (!this._iconsFaded || !iconnew) iconnew = this.metaApp.create_icon_texture(this._iconsSize);
                if (iconnew) this._icons.set(this._iconsFaded ? -this._iconsSize : this._iconsSize, iconnew);
            }
            if (iconnew && iconnew != icon) this._slicerIcon.setIcon(iconnew);
		} // let (icon, iconnew)
        _D('<');
	},

	_update: function() {
        _D('>' + this.__name__ + '._update()');
//		if (this._slicerIcon) this._slicerIcon.actor.queue_relayout();
		this._updateMenu();
        _D('<');
	},

	_updateAppState: function(appSys, app) {
        _D('>' + this.__name__ + '._updateAppState()');
		if (app && this.metaApp == app && app.state == Shell.AppState.RUNNING) {
			this._updateMenu();
		}
        _D('<');
	},

	// GNOMENEXT: ui/panel.js: class AppMenuButton
	_updateMenu: function() {
        _D('>' + this.__name__ + '._updateMenu()');
		if (!this.metaApp || this.metaApp.state != Shell.AppState.RUNNING) {
	        _D('<');
            return;
		}
		let (	menu = null,
		     	actionGroup = this.metaApp.menu && this.metaApp.action_group,
		     	thisRemote = this.menu && (this.menu instanceof PopupMenu.RemoteMenu)) {
			if (actionGroup) {
				if (!thisRemote || this.menu.actionGroup != actionGroup) {
					menu = new PopupMenu.RemoteMenu(this.actor, this.metaApp.menu, actionGroup);
				} // if (!thisRemote || this.menu.actionGroup != actionGroup)
			} // if (actionGroup)
			else {
				if (!this.menu || thisRemote) {
                    // set up menu
                    if (this._trackerApp && dbFinConsts.arrayAppMenuItems.length) {
                        menu = new PopupMenu.PopupMenu(this.actor, 0.0, St.Side.TOP, 0);
                        for (let i = 0; i < dbFinConsts.arrayAppMenuItems.length; ++i) {
							let (   text = dbFinConsts.arrayAppMenuItems[i][0],
                                    functionName = dbFinConsts.arrayAppMenuItems[i][1]) {
								if (text && text != '' && this._trackerApp[functionName]) {
									menu.addAction(text, Lang.bind(this._trackerApp, this._trackerApp[functionName]));
                                }
								else {
									menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                                }
							} // let (text, functionName)
						} // for (let i)
                    } // if (this._trackerApp && dbFinConsts.arrayAppMenuItems.length)
				} // if (!this.menu || thisRemote)
			} // if (actionGroup) else
			if (menu && this.menu != menu) {
				this._signals.disconnectId('menu-toggled');
				this.setMenu(menu);
				this._menuManager.addMenu(menu);
				// GNOMENEXT: ui/popupMenu.js: class PopupMenu
				this._signals.connectId('menu-toggled', {	emitter: this.menu, signal: 'open-state-changed',
				 											callback: this._menuToggled, scope: this });
			}
		}
        _D('<');
	},

    menuToggle: function() {
        _D('>' + this.__name__ + '.menuToggle()');
        if (this.menu) {
			this.menu.toggle();
		}
        _D('<');
    },

    _menuToggled: function(menu, state) {
        _D('>' + this.__name__ + '._menuToggled()');
		if (menu == this.menu && !state) {
			// make sure we are still "active" if focused
			if (this._trackerApp && this._trackerApp._updateFocused) this._trackerApp._updateFocused();
		}
        _D('<');
    },

	_styleChanged: function() {
        _D('>' + this.__name__ + '._styleChanged()');
		this._minHPadding = 0;
		this._natHPadding = 0;
        _D('<');
	},

	_buttonClicked: function(state, key) {
        _D('>' + this.__name__ + '._buttonClicked()');
        if (!this._trackerApp) {
            _D('this._trackerApp === null');
            _D('<');
            return;
        }
        if (!key || key == '' || (!state.scroll && (!state.clicks || state.clicks < 1))) {
            _D('<');
            return;
        }
        if (!state.scroll && state.clicks > 2) {
            state.clicks = 2;
        }
        let (functionIndex = dbFinUtils.settingsParseInt(   this._settings, 'mouse-app-' + key,
                                                            0, dbFinConsts.arrayAppClickFunctions.length - 1, 0)) {
            if (functionIndex) { // functionIndex === 0 is default corresponding to no action
                let (functionRow = dbFinConsts.arrayAppClickFunctions[functionIndex]) {
					if (state.scroll) state.clicks = state.up ? 1 : 2;
                    if (functionRow.length && functionRow.length > state.clicks) {
                        let (functionName = functionRow[state.clicks]) {
                            if (functionName != '' && this._trackerApp[functionName]) {
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
        _D('>' + this.__name__ + '._onButtonPress()');
		// nothing to do here
		_D('<');
	}
});
