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
 * dbfinactivities.js
 * Alternative Activities button.
 *
 */

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Signals = imports.signals;

const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const Util = imports.misc.util;

const ExtensionSystem = imports.ui.extensionSystem;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinAnimation = Me.imports.dbfinanimation;
const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinClicked = Me.imports.dbfinclicked;
const dbFinConsts = Me.imports.dbfinconsts;
const dbFinPopupMenu = Me.imports.dbfinpopupmenu;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinTimeout = Me.imports.dbfintimeout;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

// menu stuff
const dbFinPopupSubMenuMenuItemAutoClose = new Lang.Class({
    Name: 'dbFin.PopupSubMenuMenuItemAutoClose',
    Extends: PopupMenu.PopupSubMenuMenuItem,

    _init: function () {
        this.parent.apply(this, arguments);
        if (this.menu) {
            this.menu._openWas = this.menu.open;
            this.menu.open = Lang.bind(this.menu, this._submenuOpen);
            this.menu._closeWas = this.menu.close;
            this.menu.close = Lang.bind(this.menu, this._submenuClose);
            this.menu._removeTopSubmenuOpenedLast = Lang.bind(this.menu, this._removeTopSubmenuOpenedLast);
        }
    },

    destroy: function () {
        if (this.menu && this.menu._removeTopSubmenuOpenedLast) this.menu._removeTopSubmenuOpenedLast();
        this.parent.apply(this, arguments);
    },

    // bounded to this.menu
    _submenuOpen: function (animate) {
        let (top = this._getTopMenu()) {
            if (top) {
                if (top._yawlAASubmenuOpenedLast && top._yawlAASubmenuOpenedLast !== this) {
                    top._yawlAASubmenuOpenedLast.close(animate);
                }
                top._yawlAASubmenuOpenedLast = this;
            }
        }
        if (this._openWas) {
            if (!animate) {
                this._openWas(animate);
            }
            else {
                this.actor.set_height(-1);
                let (ahn = this.actor.get_preferred_height(-1)[1]) {
                    this._openWas(animate);
                    dbFinAnimation.animateToState(this.actor, { _arrow_rotation: 90, height: ahn }, function () {
                        if (this.actor) {
                            this.actor.set_height(-1);
                            // emit 'open-state-changed' signal on GS 3.6 & 3.8
                            if (dbFinConsts.arrayShellVersion[0] == 3
                                && dbFinConsts.arrayShellVersion[1] <= 8) {
                                this.emit('open-state-changed', true);
                            }
                        }
                    }, this, 100, 'linear', true);
                    dbFinAnimation.animateToState(this._arrow, { rotation_angle_z: 90 }, null, null, 100, 'linear');
                }
            }
        }
    },
    _submenuClose: function (animate) {
        if (this._removeTopSubmenuOpenedLast) this._removeTopSubmenuOpenedLast();
        if (this._closeWas) {
            if (!animate) {
                this._closeWas(animate);
            }
            else {
                this._closeWas(animate);
                dbFinAnimation.animateToState(this.actor, { _arrow_rotation: 0, height: 0 }, function () {
                    if (this.actor) {
                        this.actor.hide();
                        this.actor.set_height(-1);
                        // emit 'open-state-changed' signal on GS 3.6 & 3.8
                        if (dbFinConsts.arrayShellVersion[0] == 3
                            && dbFinConsts.arrayShellVersion[1] <= 8) {
                            this.emit('open-state-changed', false);
                        }
                    }
                }, this, 100, 'linear', true);
                dbFinAnimation.animateToState(this._arrow, { rotation_angle_z: 0 }, null, null, 100, 'linear');
            }
        }
    },
    _removeTopSubmenuOpenedLast: function () {
        let (top = this._getTopMenu()) {
            if (top && top._yawlAASubmenuOpenedLast === this) top._yawlAASubmenuOpenedLast = null;
        }
    }
});

// main class
const dbFinActivities = new Lang.Class({
	Name: 'dbFin.Activities',

    _init: function() {
    	_D('>' + this.__name__ + '._init()');

        this._activities = Main.panel && (Main.panel.statusArea || Main.panel._statusArea);
        this._activities = this._activities && this._activities['activities'] || null;
        this._activitiesContainer = this._activities && this._activities.container || null;
        this._activitiesActor = this._activitiesContainer && this._activities.actor || null;
        if (!this._activitiesActor || !(this._activities instanceof PanelMenu.Button)) {
            this._activitiesActor = null;
            this._activities = null;
            _D('!Activities button is not found.');
            _D('<');
            return;
        }

		this._signals = new dbFinSignals.dbFinSignals();
        this._timeout = new dbFinTimeout.dbFinTimeout();

		this.hovered = []; // actors "hovering" Activities button

        this._bin = new St.Bin({ reactive: true, track_hover: true });
        if (this._bin) {
            this._activitiesActor.add_child(this._bin);
            this._bin.add_style_class_name('face');
            this._bin._delegate = this._activitiesActor;
            this._signals.connectNoId({ emitter: this._bin, signal: 'enter-event',
                                        callback: this.hoverEnter, scope: this });
            this._signals.connectNoId({ emitter: this._bin, signal: 'leave-event',
                                        callback: this.hoverLeave, scope: this });
        }

        this._activitiesContainer.add_style_class_name('alternative-activities-container');
        this._activitiesContainer.clip_to_allocation = false;
        this._activitiesContainer.reactive = true;
        this._activitiesContainer.track_hover = true;

        this._activitiesActor.clip_to_allocation = true;
        this._activitiesActor.reactive = true;
        this._activitiesActor.track_hover = true;
        this._signals.connectNoId({ emitter: this._activitiesActor, signal: 'allocate',
                                    callback: this._activitiesActorAllocate, scope: this },
                                  true);
        this._signals.connectNoId({ emitter: this._activitiesActor, signal: 'style-changed',
                                    callback: this._updateLabelWidth, scope: this },
                                  true);

        this.label = this._activitiesActor.label_actor || this._activities._label || this._activities.label;
        if (this.label) {
            this._signals.connectNoId({	emitter: global.screen, signal: 'notify::n-workspaces',
                                        callback: this._updateLabel, scope: this });
            this._signals.connectNoId({	emitter: global.window_manager, signal: 'switch-workspace',
                                        callback: this._updateLabel, scope: this });
            this._labelTextWas = this.label.get_text();
            this._labelXAlignWas = this.label.x_align;
            this.label.x_align = Clutter.ActorAlign.FILL;
            this.label.clip_to_allocation = true;
            if (this.label.get_children()[0]) {
                this.label.get_children()[0].x_align = Clutter.ActorAlign.CENTER;
                this.label.get_children()[0].y_align = Clutter.ActorAlign.CENTER;
            }
            this._updateLabel();
        }

        this._extensionMenuItems = new dbFinArrayHash.dbFinArrayHash(); // [ [ id, { menu:, menuEnable:, menuPreferences:, menuSoftRestart:, menuHardRestart:, menuDisable: } ] ]
        this._buildMenu();

        this._frequencies = new dbFinArrayHash.dbFinArrayHash();
        this._favorites = [];

        this._updatedExtensionFrequencies = function () {
            this._extensionFrequenciesLoad();
        }
        this._updatedExtensionFavorites = function () {
            this._extensionFavoritesLoad();
        }
        this._updatedStyleForceDefault = function () {
            if (this._activitiesActor) this._activitiesActor.name = 'panelActivities' + (global.yawlAA && global.yawlAA._styleForceDefault ? 'Alternative' : '');
        };
        this._updatedStyleBackground = function () {
            if (this._activitiesContainer) {
                dbFinConsts.arrayStyleBackgrounds.forEach(Lang.bind(this, function (row) { this._activitiesContainer.remove_style_class_name(row[1]); }));
                if (global.yawlAA && global.yawlAA._styleBackground) {
                    this._activitiesContainer.add_style_class_name(dbFinConsts.arrayStyleBackgrounds[global.yawlAA._styleBackground][1]);
                }
            }
        };
        // below: this._updatedStyleCustomCss
        this._updatedExtensionManagerSort = function () {
            this._removeAllExtensionMenuItems();
        }
        this._updatedSubmenuAdditional = function () {
            if (this.menu && this.menu._yawlAAMenuAdditional && this.menu._yawlAAMenuAdditional.actor) {
                this.menu._yawlAAMenuAdditional.actor.visible = global.yawlAA && global.yawlAA._submenuAdditional;
            }
        }
        this._updatedMouseScrollTimeout = function () {
			if (this._clicked) {
				this._clicked.destroy();
				this._clicked = null;
			}
            if (global.yawlAA && this._bin) {
                this._clicked = new dbFinClicked.dbFinClicked(this._bin, this._buttonClicked, this,
                                /*single = */true, /*doubleClicks = */false, /*scroll = */true,
                                /*dragAndDrop = */false, /*clickOnRelease = */true, /*longClick = */true,
                                /*clicksTimeThreshold = */null, /*scrollTimeout = */global.yawlAA._mouseScrollTimeout);
            }
		};

        this._ensureVisibleCounter = 0;
        this._signals.connectNoId({ emitter: this._activitiesContainer, signal: 'notify::visible',
                                    callback: this._ensureVisible, scope: this },
                                  true);
        this._ensureVisible();

        this._signals.connectNoId({ emitter: Main.overview, signal: 'showing',
                                    callback: this.hoverEnter, scope: this });
        this._signals.connectNoId({ emitter: Main.overview, signal: 'hiding',
                                    callback: this.hoverLeave, scope: this });

        global.yawlAA.watch(this);
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
        if (this._clicked) {
            this._clicked.destroy();
            this._clicked = null;
        }
        this.hoverLeaveAll();
        this._unloadCustomCss();
        this._favorites = [];
        if (this._frequencies) {
            this._frequencies.destroy();
            this._frequencies = null;
        }
        this._destroyMenu();
        if (this._extensionMenuItems) {
            this._extensionMenuItems.destroy();
            this._extensionMenuItems = null;
        }
        if (this.label) {
            this.label.set_text(' ');
            this.label.x_align = this._labelXAlignWas;
            this.label.set_text(this._labelTextWas);
            this.label = null;
        }
        if (this._bin) {
            this._bin.destroy();
            this._bin = null;
        }
        if (this._activitiesActor) {
            this._activitiesActor.name = 'panelActivities';
            this._activitiesActor = null;
        }
        if (this._activitiesContainer) {
            this._activitiesContainer.remove_style_class_name('alternative-activities-container');
            this._activitiesContainer = null;
        }
        this._activities = null;
        this.emit('destroy');
		_D('<');
	},

    _activitiesActorAllocate: function(actor, box, flags) {
        _D('@' + this.__name__ + '._activitiesActorAllocate()');
        let (childBox = this._bin && this._activitiesActor && new Clutter.ActorBox()) {
            if (childBox) {
                dbFinUtils.setBox(childBox,
                                  Math.min(0, box.x1),
                                  Math.min(0, box.y1),
                                  Math.max(this._activitiesActor.width || 0, box.x2),
                                  Math.max(this._activitiesActor.height || 0, box.y2));
                this._bin.allocate(childBox, flags);
            }
        }
        _D('<');
    },

    hoverEnter: function(actor) {
        _D('>' + this.__name__ + '.hoverEnter()');
		if (!actor || !this.hovered || this.hovered.indexOf(actor) != -1) {
            _D('<');
            return;
        }
        this.hovered.push(actor);
        if (typeof actor.connect == 'function') try { actor._yawlAAHoverLeaveDestroyId = actor.connect('destroy', Lang.bind(this, this.hoverLeave)); } catch (e) { }
        if (this._activitiesContainer) this._activitiesContainer.add_style_class_name('active');
        _D('<');
    },

    hoverLeave: function(actor) {
        _D('>' + this.__name__ + '.hoverLeave()');
		let (index = actor && this.hovered ? this.hovered.indexOf(actor) : -1) {
            if (index != -1) {
                this.hovered.splice(index, 1);
                if (actor._yawlAAHoverLeaveDestroyId && typeof actor.disconnect == 'function') try { actor.disconnect(actor._yawlAAHoverLeaveDestroyId); } catch (e) { }
            }
            if (index == -1 || this.hovered && this.hovered.length) {
                _D('<');
                return;
            }
        }
        if (this._activitiesContainer) this._activitiesContainer.remove_style_class_name('active');
        _D('<');
    },

    hoverLeaveAll: function() {
        _D('>' + this.__name__ + '.hoverLeaveAll()');
        if (this.hovered) {
            this.hovered.slice().forEach(Lang.bind(this, function (actor) { this.hoverLeave(actor); })); // not optimal but stable
        }
        _D('<');
    },

    _ensureVisible: function() {
        _D('>' + this.__name__ + '._ensureVisible()');
        if (this._activities && this._activitiesContainer && !this._activitiesContainer.visible) {
            ++this._ensureVisibleCounter;
            if (this._ensureVisibleCounter > 10) {
                _D('<');
                return;
            } else if (this._ensureVisibleCounter == 10) {
                this._timeout.remove('ensure-visible');
                Main.notifyError('[Alternative Activities]'
                                 + ' ' + _("Cannot show Activities button, something actively hides it.")
                                 + ' ' + _("This might be another extension forcing the native GNOME Shell's Activities button to be hidden.")
                                 + ' ' + _("Alternative Activities uses the original Activities button.")
                                 + ' ' + _("Please disable anything that might mess with it.")
                                 + ' ' + _("Temporary disabling...")
                                 + ' ' + _("Restart GNOME Shell to try again."));
                Mainloop.idle_add(function () { ExtensionSystem.disableExtension(Me.uuid); });
                _D('<');
                return;
            }
            this._timeout.add('ensure-visible', 5000, function () { this._ensureVisibleCounter = 0; }, this, true, false, true);
            if (global.yawl && global.yawl.set && global.yawl._hideActivities) {
                this._timeout.add('ensure-visible-yawl', 250, function () { global.yawl.set('hide-activities', false); }, null, true, true);
            }
            if (this._activitiesContainer) this._activitiesContainer.show();
        }
        _D('<');
    },

    _updateLabel: function() {
        _D('>' + this.__name__ + '._updateLabel()');
        if (this.label) {
            let (workspaceActiveIndex = global.screen && global.screen.get_active_workspace_index()) {
                this.label.set_text(workspaceActiveIndex || workspaceActiveIndex === 0 ? '' + (workspaceActiveIndex + 1) : '?');
                this._updateLabelWidth();
                let (workspaceMenuItems = this.menu && this.menu.isOpen && this.menu._yawlAAMenuWorkspaces
                                          && this.menu._yawlAAMenuWorkspaces._getMenuItems()) {
                    if (workspaceMenuItems) {
                        workspaceMenuItems.forEach(Lang.bind(this, function (menuItem, index) {
                            if (index === workspaceActiveIndex) this._selectMenuItem(menuItem);
                            else this._unselectMenuItem(menuItem);
                        }));
                    }
                }
            }
        }
        _D('<');
    },

    _updateLabelWidth: function() {
        _D('>' + this.__name__ + '._updateLabelWidth()');
        if (this.label) {
            let (wln = this.label.get_preferred_width(-1)[1] || 0) {
                this.label.min_width = wln + (this._activities && this._activities._minHPadding || 0) * 2;
                this.label.queue_relayout();
            }
        }
        _D('<');
    },

    _updatedStyleCustomCss: function() {
        _D('>' + this.__name__ + '._updatedStyleCustomCss()');
        this._unloadCustomCss();
        let (theme = St.ThemeContext.get_for_stage(global.stage).get_theme(),
             filename = global.yawlAA && global.yawlAA._styleCustomCss && global.yawlAA._styleCustomCss.replace(/^~/, GLib.get_home_dir())) {
            if (theme && filename && GLib.file_test(filename, GLib.FileTest.EXISTS)) {
                try {
                    theme.load_stylesheet(filename);
                    Main.loadTheme();
                    this._cssCustom = filename;
                }
                catch (e) {
                }
            }
        }
        _D('<');
    },

    _unloadCustomCss: function() {
        _D('>' + this.__name__ + '._unloadCustomCss()');
        let (theme = this._cssCustom && St.ThemeContext.get_for_stage(global.stage).get_theme()) {
            if (theme) {
                try {
                    theme.unload_stylesheet(this._cssCustom);
                    Main.loadTheme();
                }
                catch (e) {
                }
                this._cssCustom = null;
            }
        }
        _D('<');
    },

    _extensionFrequenciesLoad: function () {
        _D('@' + this.__name__ + '._extensionFrequenciesLoad()');
        if (this._frequencies && global.yawlAA && global.yawlAA._extensionFrequencies) {
            let (frequencies = []) {
                try { frequencies = JSON.parse(global.yawlAA._extensionFrequencies); } catch (e) {}
                if (!frequencies || Object.prototype.toString.call(frequencies) != '[object Array]' || !frequencies.length) frequencies = [];
                this._frequencies.removeAll();
                this._frequencies.setArray(frequencies);
                if (global.yawlAA._extensionManagerSort == dbFinConsts.EXTENSIONSORTMETHODS_FREQUENCY) this._removeAllExtensionMenuItems();
            }
        }
        _D('<');
    },

    _extensionFrequenciesIncrement: function (id) {
        _D('@' + this.__name__ + '._extensionFrequenciesIncrement()');
        if (this._frequencies && id) {
            this._frequencies.set(id, 1 + (this._frequencies.get(id) || 0));
            if (global.yawlAA) {
                try { global.yawlAA.set('extension-frequencies', JSON.stringify(this._frequencies.toArray())); } catch (e) { }
            }
        }
        _D('<');
    },

    _extensionFavoritesLoad: function () {
        _D('@' + this.__name__ + '._extensionFavoritesLoad()');
        if (this._favorites && global.yawlAA && global.yawlAA._extensionFavorites) {
            try { this._favorites = JSON.parse(global.yawlAA._extensionFavorites); } catch (e) {}
            if (!this._favorites || Object.prototype.toString.call(this._favorites) != '[object Array]'
                || !this._favorites.length) this._favorites = [];
        }
        _D('<');
    },

    _extensionFavoritesToggle: function (id) {
        _D('@' + this.__name__ + '._extensionFavoritesToggle()');
        if (this._favorites && id) {
            let (index = this._favorites.indexOf(id)) {
                if (index == -1) this._favorites.push(id);
                else this._favorites.splice(index, 1);
                if (global.yawlAA) {
                    try { global.yawlAA.set('extension-favorites', JSON.stringify(this._favorites)); } catch (e) { }
                }
            }
        }
        _D('<');
    },

    _buildMenu: function() {
        _D('>' + this.__name__ + '._buildMenu()');
        this._destroyMenu();
        let (menu = this._activitiesActor && new PopupMenu.PopupMenu(this._activitiesActor, 0.0, St.Side.TOP, 0)) {
            if (menu && menu.actor) {
                this.menu = menu;
                menu._dbFinActivities = this;

                menu.actor.add_style_class_name('alternative-activities-menu');
                if (global.yawlAA && global.yawlAA._styleBackground) {
                    menu.actor.add_style_class_name(dbFinConsts.arrayStyleBackgrounds[global.yawlAA._styleBackground][1]);
                }

                menu._yawlAAMenuWorkspaces = new dbFinPopupMenu.dbFinPopupMenuScrollableSection();
                if (menu._yawlAAMenuWorkspaces) menu.addMenuItem(menu._yawlAAMenuWorkspaces);

                menu._yawlAAMenuSeparatorWE = new PopupMenu.PopupSeparatorMenuItem();
                if (menu._yawlAAMenuSeparatorWE) menu.addMenuItem(menu._yawlAAMenuSeparatorWE);

                menu._yawlAAMenuExtensions = new PopupMenu.PopupMenuSection();
                if (menu._yawlAAMenuExtensions) menu.addMenuItem(menu._yawlAAMenuExtensions);

                menu._yawlAAMenuSeparatorEEM = new PopupMenu.PopupSeparatorMenuItem();
                if (menu._yawlAAMenuSeparatorEEM) menu.addMenuItem(menu._yawlAAMenuSeparatorEEM);

                menu._yawlAAMenuExtensionsMore = new dbFinPopupSubMenuMenuItemAutoClose('...');
                if (menu._yawlAAMenuExtensionsMore) menu.addMenuItem(menu._yawlAAMenuExtensionsMore);

                menu._yawlAAMenuSeparatorEED = new PopupMenu.PopupSeparatorMenuItem();
                if (menu._yawlAAMenuSeparatorEED) menu.addMenuItem(menu._yawlAAMenuSeparatorEED);

                menu._yawlAAMenuExtensionsDisabled = new dbFinPopupSubMenuMenuItemAutoClose(_("Disabled extensions"));
                if (menu._yawlAAMenuExtensionsDisabled) menu.addMenuItem(menu._yawlAAMenuExtensionsDisabled);

                // additional menu items
                menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

                menu._yawlAAMenuAdditional = new PopupMenu.PopupMenuSection();
                if (menu._yawlAAMenuAdditional) {
                    menu.addMenuItem(menu._yawlAAMenuAdditional);

                    if (GLib.file_test('/usr/bin/gnome-tweak-tool', GLib.FileTest.EXISTS)) {
                        menu._yawlAAMenuAdvancedSettings = new PopupMenu.PopupMenuItem(_("Advanced settings"));
                        if (menu._yawlAAMenuAdvancedSettings) {
                            menu._yawlAAMenuAdditional.addMenuItem(menu._yawlAAMenuAdvancedSettings);
                            menu._yawlAAMenuAdvancedSettings.connect('activate', function (menuItem, event) {
                                try { Util.trySpawn([ '/usr/bin/gnome-tweak-tool', '' ]); } catch (e) {}
                            });
                        }
                    }
                }

                menu._yawlAAOpenWas = menu.open;
                menu.open = Lang.bind(menu, this._openMenu);

                this._activitiesMenuWas = this._activities.menu;
                this._activities.setMenu(menu);

                this._menuManager = Main.panel && Main.panel.menuManager || null;
                if (this._menuManager) this._menuManager.addMenu(menu);

                this._signals.connectId('menu-state', { emitter: menu, signal: 'open-state-changed',
                                                        callback: function (menu, state) {
                                                            if (state) this.hoverEnter(menu);
                                                            else this.hoverLeave(menu);
                                                        }, scope: this });
                this._signals.connectId('menu-destroy', {   emitter: menu, signal: 'destroy',
                                                            callback: function (menu) {
                                                                if (this._signals) {
                                                                    this._signals.disconnectId('menu-destroy');
                                                                    this._signals.disconnectId('menu-state');
                                                                }
                                                                this.hoverLeave(menu);
                                                            }, scope: this });
            } // if (menu && menu.actor)
        } // let (menu)
        _D('<');
    },

    _destroyMenu: function() {
        _D('>' + this.__name__ + '._destroyMenu()');
        if (this._extensionMenuItems) {
            this._removeAllExtensionMenuItems();
        }
        if (this._menuManager) {
            if (this.menu) this._menuManager.removeMenu(this.menu);
            this._menuManager = null;
        }
        if (this.menu) {
            if (this.menu._yawlAAOpenWas) {
                this.menu.open = this.menu._yawlAAOpenWas;
            }
            if (this.menu._yawlAAMenuAdvancedSettings) {
                this.menu._yawlAAMenuAdvancedSettings.destroy();
                this.menu._yawlAAMenuAdvancedSettings = null;
            }
            if (this.menu._yawlAAMenuAdditional) {
                this.menu._yawlAAMenuAdditional.removeAll();
                this.menu._yawlAAMenuAdditional.destroy();
                this.menu._yawlAAMenuAdditional = null;
            }
            if (this.menu._yawlAAMenuExtensionsDisabled) {
                if (this.menu._yawlAAMenuExtensionsDisabled.menu) {
                    this.menu._yawlAAMenuExtensionsDisabled.menu.removeAll();
                }
                this.menu._yawlAAMenuExtensionsDisabled.destroy();
                this.menu._yawlAAMenuExtensionsDisabled = null;
            }
            if (this.menu._yawlAAMenuSeparatorEED) {
                this.menu._yawlAAMenuSeparatorEED.destroy();
                this.menu._yawlAAMenuSeparatorEED = null;
            }
            if (this.menu._yawlAAMenuExtensionsMore) {
                if (this.menu._yawlAAMenuExtensionsMore.menu) {
                    this.menu._yawlAAMenuExtensionsMore.menu.removeAll();
                }
                this.menu._yawlAAMenuExtensionsMore.destroy();
                this.menu._yawlAAMenuExtensionsMore = null;
            }
            if (this.menu._yawlAAMenuSeparatorEEM) {
                this.menu._yawlAAMenuSeparatorEEM.destroy();
                this.menu._yawlAAMenuSeparatorEEM = null;
            }
            if (this.menu._yawlAAMenuExtensions) {
                this.menu._yawlAAMenuExtensions.removeAll();
                this.menu._yawlAAMenuExtensions.destroy();
                this.menu._yawlAAMenuExtensions = null;
            }
            if (this.menu._yawlAAMenuSeparatorWE) {
                this.menu._yawlAAMenuSeparatorWE.destroy();
                this.menu._yawlAAMenuSeparatorWE = null;
            }
            if (this.menu._yawlAAMenuWorkspaces) {
                this.menu._yawlAAMenuWorkspaces.removeAll();
                this.menu._yawlAAMenuWorkspaces.destroy();
                this.menu._yawlAAMenuWorkspaces = null;
            }
            this.menu._dbFinActivities = null;
            this.menu = null;
        }
        this._activities.setMenu(this._activitiesMenuWas || null);
        _D('<');
    },

    _selectMenuItem: function(menuItem) {
        _D('>' + this.__name__ + '._selectMenuItem()');
        if (menuItem) {
            if (menuItem.setShowDot) menuItem.setShowDot(true);
            else if (menuItem.setOrnament && PopupMenu.Ornament) menuItem.setOrnament(PopupMenu.Ornament.DOT);
        }
        _D('<');
    },

    _unselectMenuItem: function(menuItem) {
        _D('>' + this.__name__ + '._unselectMenuItem()');
        if (menuItem) {
            if (menuItem.setShowDot) menuItem.setShowDot(false);
            else if (menuItem.setOrnament && PopupMenu.Ornament) menuItem.setOrnament(PopupMenu.Ornament.NONE);
        }
        _D('<');
    },

    _ensureExtensionMenuItem: function (extension) {
        _D('>' + this.__name__ + '._ensureExtensionMenuItem()');
        if (!extension || !extension.uuid || !extension.metadata || !extension.metadata.name
            || !this._extensionMenuItems || !this.menu || !this.menu._yawlAAMenuExtensions
            || !this.menu._yawlAAMenuExtensionsMore || !this.menu._yawlAAMenuExtensionsMore.menu
            || !this.menu._yawlAAMenuExtensionsDisabled || !this.menu._yawlAAMenuExtensionsDisabled.menu) {
            _D('<');
            return undefined;
        }
        let (menus = this._extensionMenuItems.get(extension.uuid)) {
            if (!menus) {
                menus = {
                    menu: new dbFinPopupSubMenuMenuItemAutoClose(extension.metadata.name),
                    menuFavoriteOn: this._addExtensionAction(this.menu._yawlAAMenuExtensionsMore.menu, extension,
                                                       '\u2605 ' + extension.metadata.name, '_extensionFavoriteOn'),
                    menuEnable: this._addExtensionAction(this.menu._yawlAAMenuExtensionsDisabled.menu, extension,
                                                         '\u2295 ' + extension.metadata.name, '_extensionEnable')
                };
                if (menus.menu && (!menus.menu.actor || !menus.menu.menu || !menus.menu.menu.actor)) {
                    menus.menu = null;
                }
                else if (menus.menuFavoriteOn && !menus.menuFavoriteOn.actor) {
                    menus.menuFavoriteOn = null;
                }
                else if (menus.menuEnable && !menus.menuEnable.actor) {
                    menus.menuEnable = null;
                }
                else if (menus.menu && menus.menuFavoriteOn && menus.menuEnable) {
                    this.menu._yawlAAMenuExtensions.addMenuItem(menus.menu);
                    menus.menu.actor.visible = false;
                    menus.menuFavoriteOn.actor.visible = false;
                    menus.menuEnable.actor.visible = false;
                    menus.menuPreferences = this._addExtensionAction(menus.menu.menu, extension, '\u2692 ' + _("Extension preferences"), '_extensionPreferences');
                    menus.menuSoftRestart = this._addExtensionAction(menus.menu.menu, extension, '\u26aa ' + _("Soft restart"), '_extensionSoftRestart');
                    menus.menuHardRestart = this._addExtensionAction(menus.menu.menu, extension, '\u26ab ' + _("Hard restart"), '_extensionHardRestart');
                    menus.menuFavoriteOff = this._addExtensionAction(menus.menu.menu, extension, '\u2606 ' + _("Hide extension"), '_extensionFavoriteOff'),
                    menus.menuDisable = this._addExtensionAction(menus.menu.menu, extension, '\u2296 ' + _("Disable extension"), '_extensionDisable');
                }
                if (!menus.menuPreferences || !menus.menuPreferences.actor
                        || !menus.menuSoftRestart || !menus.menuSoftRestart.actor
                        || !menus.menuHardRestart || !menus.menuHardRestart.actor
                        || !menus.menuFavoriteOff || !menus.menuFavoriteOff.actor
                        || !menus.menuDisable || !menus.menuDisable.actor) {
                    _D('<');
                    return undefined;
                }
                this._extensionMenuItems.set(extension.uuid, menus);
            }
            _D('<');
            return menus;
        }
    },

    _removeAllExtensionMenuItems: function() {
        _D('>' + this.__name__ + '._removeAllExtensionMenuItems()');
        if (this._extensionMenuItems) {
            this._extensionMenuItems.forEach(Lang.bind(this, function (id, menus) {
                menus.menuDisable = null;
                menus.menuFavoriteOff = null;
                menus.menuHardRestart = null;
                menus.menuSoftRestart = null;
                menus.menuPreferences = null;
                if (menus.menuEnable) {
                    menus.menuEnable.destroy();
                    menus.menuEnable = null;
                }
                if (menus.menuFavoriteOn) {
                    menus.menuFavoriteOn.destroy();
                    menus.menuFavoriteOn = null;
                }
                if (menus.menu) {
                    if (menus.menu.menu) menus.menu.menu.removeAll();
                    menus.menu.destroy();
                    menus.menu = null;
                }
                this._extensionMenuItems.remove(id);
            }));
        }
        _D('<');
    },

    _sortExtensionsByName: function (e1, e2) {
        return e1.metadata.name.toUpperCase() < e2.metadata.name.toUpperCase() ? -1 : 1;
    },
    _sortExtensionsByFrequency: function (e1, e2) {
        if (this._frequencies) {
            let (f1 = this._frequencies.get(e1.uuid) || 0, f2 = this._frequencies.get(e2.uuid) || 0) {
                return f1 > f2 ? -1 : f1 < f2 ? 1 : this._sortExtensionsByName(e1, e2);
            }
        }
        return this._sortExtensionsByName(e1, e2);
    },

    // bounded to this.menu
    _openMenu: function(animate) {
        _D('>' + this.__name__ + '._openMenu()');
        // workspaces
        if (this._yawlAAMenuWorkspaces) {
            this._yawlAAMenuWorkspaces.removeAll();
            // workspaces and running apps
            let (n_workspaces = global.screen && global.screen.n_workspaces,
                 workspaceActiveIndex = global.screen && global.screen.get_active_workspace_index(),
                 workspaces = [],
                 workspacesApps = []) {
                for (let i = 0; i < n_workspaces; ++i) {
                    workspaces.push(global.screen.get_workspace_by_index(i));
                    workspacesApps.push([]);
                }
                let (metaApps = null,
                     appButtons = global.yawl && global.yawl.panelApps && global.yawl.panelApps._childrenObjects
                                  && global.yawl.panelApps._childrenObjects._keys || null) {
                    if (appButtons) {
                        metaApps =  appButtons
                                    .map(function (appButton) {
                                        return  appButton && appButton.metaApp && appButton.metaApp.state != Shell.AppState.STOPPED
                                                ? appButton.metaApp
                                                : null;
                                    });
                    }
                    else {
                        metaApps =  Shell.AppSystem.get_default().get_running()
                                    .filter(function (metaApp) {
                                        return  metaApp && metaApp.state != Shell.AppState.STOPPED;
                                    });
                    }
                    metaApps.forEach(function (metaApp) {
                        if (!metaApp) return;
                        for (let i = 0; i < n_workspaces; ++i) {
                            if (metaApp.is_on_workspace(workspaces[i])) workspacesApps[i].push(metaApp);
                        }
                    });
                } // let (metaApps, appButtons)
                for (let i = 0; i < n_workspaces; ++i) {
                    let (menuItem = new PopupMenu.PopupBaseMenuItem(),
                         apps = workspacesApps[i]) {
                        if (menuItem) menuItem._box = new St.BoxLayout({ vertical: false, y_align: Clutter.ActorAlign.CENTER, y_expand: false });
                        if (menuItem && menuItem.actor && menuItem._box) {
                            if (menuItem.addActor) menuItem.addActor(menuItem._box);
                            else menuItem.actor.add_actor(menuItem._box);
                            let (label = new St.Label({ text: '' + (i + 1) + ' : ', y_align: Clutter.ActorAlign.CENTER })) {
                                if (label) {
                                    menuItem._box.add_child(label);
                                }
                            }
                            for (let j = 0; j < apps.length; ++j) {
                                if (j >= 10) {
                                    let (label = new St.Label({ text: '...', y_align: Clutter.ActorAlign.END })) {
                                        if (label) {
                                            label.set_style('padding: 0 0 0 12px;');
                                            menuItem._box.add_child(label);
                                        }
                                    }
                                    break;
                                }
                                let (icon = new St.Bin()) {
                                    if (icon) {
                                        icon.set_child(apps[j].create_icon_texture(24) || null);
                                        icon.set_style('padding: 0 0 0 12px;');
                                        icon.x_align = Clutter.ActorAlign.CENTER;
                                        icon.y_align = Clutter.ActorAlign.CENTER;
                                        icon.x_expand = false;
                                        icon.y_expand = false;
                                        menuItem._box.add_child(icon);
                                    }
                                }
                            } // for (let j)
                            if (i === workspaceActiveIndex) {
                                this._dbFinActivities._selectMenuItem(menuItem);
                            }
                            menuItem.connect('activate', (function (i) { return function (menuItem, event) {
                                let (workspace = global.screen && global.screen.get_workspace_by_index(i)) {
                                    if (workspace) workspace.activate(global.get_current_time && global.get_current_time() || 0);
                                }
                            }; })(i));
                            this._yawlAAMenuWorkspaces.addMenuItem(menuItem);
                        } // if (menuItem && menuItem.actor && menuItem._box)
                    } // let (menuItem, apps)
                } // for (let i)
            } // let (n_workspaces, workspaceActiveIndex, workspaces, workspacesApps)
        } // if (this._yawlAAMenuWorkspaces)
        // extensions
        if (this._yawlAAMenuSeparatorWE) this._yawlAAMenuSeparatorWE.actor.hide();
        if (this._yawlAAMenuExtensions) this._yawlAAMenuExtensions.actor.hide();
        if (this._yawlAAMenuSeparatorEEM) this._yawlAAMenuSeparatorEEM.actor.hide();
        if (this._yawlAAMenuExtensionsMore) this._yawlAAMenuExtensionsMore.actor.hide();
        if (this._yawlAAMenuSeparatorEED) this._yawlAAMenuSeparatorEED.actor.hide();
        if (this._yawlAAMenuExtensionsDisabled) this._yawlAAMenuExtensionsDisabled.actor.hide();
        if (global.yawlAA && global.yawlAA._submenuExtensionManager
                    && this._yawlAAMenuExtensions && this._yawlAAMenuExtensionsDisabled
                    && this._dbFinActivities && this._dbFinActivities._extensionMenuItems && ExtensionUtils.extensions) {
            let (extensions = [], renew = false, enabled = false, disabled = false,
                 showFavorites = global.yawlAA._extensionManagerShowFavorites, notFavorited = false,
                 sort = dbFinConsts.arrayExtensionSortMethods[
                        dbFinUtils.inRange(global.yawlAA._extensionManagerSort, 0, dbFinConsts.arrayExtensionSortMethods.length - 1, 0)
                 ][1]) {
                sort = sort && Lang.bind(this._dbFinActivities, this._dbFinActivities[sort]) || undefined;
                for (let id in ExtensionUtils.extensions) {
                    let (extension = id && ExtensionUtils.extensions.hasOwnProperty(id) && ExtensionUtils.extensions[id]) {
                        let (state = extension && extension.metadata && extension.metadata.name && extension.state) {
                            if (state == 1 || state == 2 || state == 6) {
                                extensions.push(extension);
                                if (!this._dbFinActivities._extensionMenuItems.has(id)) renew = true;
                            }
                        }
                    }
                }
                if (renew || extensions.length != this._dbFinActivities._extensionMenuItems.length) {
                    this._dbFinActivities._removeAllExtensionMenuItems();
                }
                else {
                    this._dbFinActivities._extensionMenuItems.forEach(Lang.bind(this, function (id, menus) {
                        menus.menu.actor.visible = false;
                        menus.menuFavoriteOn.actor.visible = false;
                        menus.menuEnable.actor.visible = false;
                    }));
                }
                extensions.sort(sort);
                extensions.forEach(Lang.bind(this, function (e) {
                    let (menus = this._dbFinActivities._ensureExtensionMenuItem(e)) {
                        if (menus) {
                            if (e.state == 1) {
                                if (!showFavorites || this._dbFinActivities._favorites
                                        && this._dbFinActivities._favorites.indexOf(e.uuid) != -1) {
                                    menus.menu.actor.visible = true;
                                    menus.menuPreferences.actor.visible = e.hasPrefs;
                                    menus.menuFavoriteOff.actor.visible = showFavorites;
                                    menus.menuDisable.actor.visible = e.uuid != 'aa@dbfin.com';
                                    enabled = true;
                                }
                                else {
                                    menus.menuFavoriteOn.actor.visible = true;
                                    notFavorited = true;
                                }
                            }
                            else {
                                menus.menuEnable.actor.visible = true;
                                disabled = true;
                            }
                        }
                    }
                }));
                if (enabled) {
                    if (this._yawlAAMenuSeparatorWE) this._yawlAAMenuSeparatorWE.actor.show();
                    this._yawlAAMenuExtensions.actor.show();
                }
                if (notFavorited) {
                    if (this._yawlAAMenuSeparatorEEM) this._yawlAAMenuSeparatorEEM.actor.show();
                    this._yawlAAMenuExtensionsMore.actor.show();
                    if (this._yawlAAMenuExtensionsMore.actor.label_actor) {
                        this._yawlAAMenuExtensionsMore.actor.label_actor.set_text(
                            !enabled ? _("Extensions") : _("Other extensions")
                        );
                    }
                }
                if (disabled) {
                    if (this._yawlAAMenuSeparatorEED) this._yawlAAMenuSeparatorEED.actor.show();
                    this._yawlAAMenuExtensionsDisabled.actor.show();
                }
            } // let (extensions, renew, enabled, disabled, showFavorites, notFavorited, sort)
        } // if (should and can show extensions)
        // parent open method
        if (this._yawlAAOpenWas) Lang.bind(this, this._yawlAAOpenWas)(animate);
        _D('<');
    },

    _addExtensionAction: function (menu, extension, name, method) {
        let (menuItem = new PopupMenu.PopupMenuItem(name)) {
            menuItem._yawlAAExtension = extension;
            menuItem._yawlAAFrequencyIncrement = Lang.bind(this, this._extensionFrequenciesIncrement);
            menuItem._yawlAAFavoritesToggle = Lang.bind(this, this._extensionFavoritesToggle);
            menu.addMenuItem(menuItem);
            menuItem.connect('activate', this[method]);
            return menuItem;
        }
    },
    // not bounded
    _extensionDisable: function (menuItem, event) {
        ExtensionSystem.disableExtension(menuItem._yawlAAExtension.uuid);
        let (enabledExtensions = global.settings && global.settings.get_strv(ExtensionSystem.ENABLED_EXTENSIONS_KEY)) {
            let (index = enabledExtensions && enabledExtensions.indexOf(menuItem._yawlAAExtension.uuid)) {
                if (index != -1) {
                    enabledExtensions.splice(index, 1);
                    global.settings.set_strv(ExtensionSystem.ENABLED_EXTENSIONS_KEY, enabledExtensions);
                }
            }
        }
    },
    _extensionEnable: function (menuItem, event) {
        ExtensionSystem.enableExtension(menuItem._yawlAAExtension.uuid);
        let (enabledExtensions = global.settings && global.settings.get_strv(ExtensionSystem.ENABLED_EXTENSIONS_KEY)) {
            let (index = enabledExtensions && enabledExtensions.indexOf(menuItem._yawlAAExtension.uuid)) {
                if (index == -1) {
                    enabledExtensions.push(menuItem._yawlAAExtension.uuid);
                    global.settings.set_strv(ExtensionSystem.ENABLED_EXTENSIONS_KEY, enabledExtensions);
                }
            }
        }
    },
    _extensionFavoriteOff: function (menuItem, event) {
        if (menuItem._yawlAAFavoritesToggle) menuItem._yawlAAFavoritesToggle(menuItem._yawlAAExtension.uuid);
    },
    _extensionFavoriteOn: function (menuItem, event) {
        if (menuItem._yawlAAFavoritesToggle) menuItem._yawlAAFavoritesToggle(menuItem._yawlAAExtension.uuid);
    },
    _extensionHardRestart: function (menuItem, event) {
        ExtensionSystem.reloadExtension(menuItem._yawlAAExtension);
        if (menuItem._yawlAAFrequencyIncrement) menuItem._yawlAAFrequencyIncrement(menuItem._yawlAAExtension.uuid);
    },
    _extensionPreferences: function (menuItem, event) {
        try { Util.trySpawn([ 'gnome-shell-extension-prefs', menuItem._yawlAAExtension.uuid ]); } catch (e) { }
        if (menuItem._yawlAAFrequencyIncrement) menuItem._yawlAAFrequencyIncrement(menuItem._yawlAAExtension.uuid);
    },
    _extensionSoftRestart: function (menuItem, event) {
        ExtensionSystem.disableExtension(menuItem._yawlAAExtension.uuid);
        Mainloop.idle_add(function () { ExtensionSystem.enableExtension(menuItem._yawlAAExtension.uuid); });
        if (menuItem._yawlAAFrequencyIncrement) menuItem._yawlAAFrequencyIncrement(menuItem._yawlAAExtension.uuid);
    },

    _buttonClicked: function(state, name) {
        _D('>' + this.__name__ + '._buttonClicked()');
        if (!name || (!state.scroll && (!state.clicks || state.clicks < 1))) {
            _D('<');
            return;
        }
        if (state.scroll) {
            this.changeWorkspace(state.up ? -1 : 1);
        }
        else if (state.left) {
            if (this._activities && (typeof this._activities._onButtonRelease == 'function')) this._activities._onButtonRelease();
            else Main.overview.toggle();
        }
        else if (state.right) {
            if (this.menu) this.menu.toggle();
        }
        _D('<');
    },

    changeWorkspace: function (direction) {
        _D('>' + this.__name__ + '.changeWorkspace()');
		if (!direction || !global.screen) {
			_D('<');
			return;
		}
		let (workspaceIndex = global.screen.get_active_workspace_index() + direction) {
			let (workspace = workspaceIndex >= 0 && workspaceIndex < global.screen.n_workspaces
                             && global.screen.get_workspace_by_index(workspaceIndex)) {
				if (workspace) workspace.activate(global.get_current_time && global.get_current_time() || 0);
			}
		}
        _D('<');
   }
});
Signals.addSignalMethods(dbFinActivities.prototype);
