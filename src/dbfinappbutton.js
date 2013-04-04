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
        if (this.actor) {
            this.actor._delegate = this;
            this._bindReactiveId = this.actor.bind_property('reactive', this.actor, 'can-focus', 0);
            this.actor.reactive = true;
        }

		this._minHPadding = 0;
		this._natHPadding = 0;
        this._signals.connectNoId({ emitter: this.actor, signal: 'style-changed',
                                    callback: this._styleChanged, scope: this },
                                  /*after = */true);

        this._clicked = null;
		this._updatedMouseClickRelease =
                this._updatedMouseLongClick = function () {
			if (this._clicked) {
				this._clicked.destroy();
				this._clicked = null;
			}
			this._clicked = new dbFinClicked.dbFinClicked(this.actor, this._buttonClicked, this, /*doubleClicks = */true,
							/*scroll = */true, /*sendSingleClicksImmediately = */true,
                            /*clickOnRelease = */global.yawl._mouseClickRelease, /*longClick = */global.yawl._mouseLongClick);
		};

		// this._slicerIcon related stuff
		this._slicerIcon = new dbFinSlicerIcon.dbFinSlicerIcon();
        if (this._slicerIcon && this._slicerIcon.container) {
            if (this.actor) this.actor.add_actor(this._slicerIcon.container);
            if (Main.panel && Main.panel.actor && Main.panel.actor.get_stage()) {
                this._slicerIcon.container.min_height = Main.panel.actor.get_height();
            }
        }

		this._icons = new dbFinArrayHash.dbFinArrayHash();

        this._updatedIconsSize =
                this._updatedIconsFaded = this._updateIcon;
        this._updatedIconsOpacity = function () { if (this._slicerIcon) this._slicerIcon.setOpacity100(global.yawl._iconsOpacity); };
		this._updatedIconsClipTop = function () { if (this._slicerIcon) this._slicerIcon.setClipTop(global.yawl._iconsClipTop); };
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
            this.actor._delegate = null;
		}
        if (this._slicerIcon) {
			if (this.actor) this.actor.remove_actor(this._slicerIcon.container);
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
        if (!this.hidden && !this.hiding) {
            _D('<');
            return;
        }
		this.hidden = false;
        this.hiding = false;
		if (this._slicerIcon) this._slicerIcon.show(time);
        _D('<');
    },

    hide: function(time) {
        _D('>' + this.__name__ + '.hide()');
		if (!this.hidden && !this.hiding && this._slicerIcon) {
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
        global.yawl._iconsSize = global.yawl._iconsSize ? Math.floor((global.yawl._iconsSize + 4) / 8) * 8 : 48; // sizes are 16, 24, ..., 128
		let (   icon = this._slicerIcon.getIcon(),
                iconnew = this._icons ? this._icons.get(global.yawl._iconsFaded ? -global.yawl._iconsSize : global.yawl._iconsSize) : null) {
            if (!iconnew) {
                if (global.yawl._iconsFaded) iconnew = this.metaApp.get_faded_icon(global.yawl._iconsSize); // returns NULL sometimes
                if (!iconnew) iconnew = this.metaApp.create_icon_texture(global.yawl._iconsSize);
                if (iconnew) this._icons.set(global.yawl._iconsFaded ? -global.yawl._iconsSize : global.yawl._iconsSize, iconnew);
            }
            if (iconnew && iconnew != icon) this._slicerIcon.setIcon(iconnew);
		} // let (icon, iconnew)
        _D('<');
	},

	_update: function() {
        _D('>' + this.__name__ + '._update()');
		this._updateMenu();
        _D('<');
	},

	_updateAppState: function(appSys, app) {
        _D('>' + this.__name__ + '._updateAppState()');
		if (this.metaApp == app) {
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
        if (!name || name == '' || (!state.scroll && (!state.clicks || state.clicks < 1))) {
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
