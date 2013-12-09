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
 * dbfinmovecenter.js
 * Move central panel to the right.
 *
 */

const Lang = imports.lang;
const Signals = imports.signals;

const Clutter = imports.gi.Clutter;

const Main = imports.ui.main;
const Panel = imports.ui.panel;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinConsts = Me.imports.dbfinconsts;
const dbFinPanelButtonToggle = Me.imports.dbfinpanelbuttontoggle;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinUtils = Me.imports.dbfinutils;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

// GNOMENEXT: ui/panel.js: class ActivitiesButton
const dbFinHotCorner = new Lang.Class({
	Name: 'dbFin.HotCorner',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
		this._button = new Panel.ActivitiesButton();
		this._button.actor.name = null;
		this._button._minHPadding = 0;
		this._button._natHPadding = 0;
		this._signals = new dbFinSignals.dbFinSignals();
		this._signals.connectNoId({ emitter: this._button.actor, signal: 'get-preferred-width',
									callback: this._getPreferredSize, scope: this });
		this._signals.connectNoId({ emitter: this._button.actor, signal: 'get-preferred-height',
									callback: this._getPreferredSize, scope: this });
		this._signals.connectNoId({ emitter: this._button.actor, signal: 'allocate',
									callback: this._allocate, scope: this });
		this._signals.connectNoId({ emitter: this._button.actor, signal: 'style-changed',
									callback: this._styleChanged, scope: this },
		                          	/*after = */true);
		Main.panel['_leftBox'].insert_child_at_index(this._button.container, 0);
        _D('<');
    },

	destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
		if (this._signals) {
			this._signals.destroy();
			this._signals = null;
		}
		if (this._button) {
			Main.panel['_leftBox'].remove_child(this._button.container);
			this._button.destroy();
			this._button = null;
		}
        this.emit('destroy');
        _D('<');
	},

	_getPreferredSize: function(actor, forSize, alloc) {
        _D('@' + this.__name__ + '._getPreferredSize()');
		[ alloc.min_size, alloc.natural_size ] = [ 1, 1 ];
		_D('<');
	},

	_allocate: function(actor, box, flags) {
        _D('@' + this.__name__ + '._allocate()');
		let (	children = actor.get_children(),
		    	childBox = new Clutter.ActorBox()) {
			if (children.length) {
				dbFinUtils.setBox(childBox, 0, 0, 1, 1);
				children[0].allocate(childBox, flags);
			}
		} // let (children, childBox)
		_D('<');
	},

	_styleChanged: function(actor) {
        _D('@' + this.__name__ + '._styleChanged()');
		this._button._minHPadding = 0;
		this._button._natHPadding = 0;
		_D('<');
	}
});
Signals.addSignalMethods(dbFinHotCorner.prototype);

const dbFinMoveCenter = new Lang.Class({
    Name: 'dbFin.MoveCenter',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
		this._signals = new dbFinSignals.dbFinSignals();
		this._panelbuttonstoggle = new dbFinPanelButtonToggle.dbFinPanelButtonToggle();
		this._hotcorner = null;
		this._signals.connectNoId({ emitter: Main.panel.actor, signal: 'allocate',
									callback: this._allocate, scope: this });

        this._updatedYawlPanelPosition =
                this._updatedYawlPanelWidth =
                this._updatedMoveCenter = this._updatePanel;
        this._updatedHideActivities =
                this._updatedPreserveHotCorner = this._updateActivities;
        // this._updatedHideAppMenu: below

		this._updatePanel();

        global.yawl.watch(this);
        _D('<');
    },

    destroy: function() {
        _D('>' + this.__name__ + '.destroy()');
        if (this._signals) {
            this._signals.destroy(); // this should disconnect everything and move central panel back
            this._signals = null;
            this._updatePanel();
        }
		if (this._hotcorner) {
			this._hotcorner.destroy();
			this._hotcorner = null;
		}
        if (this._panelbuttonstoggle) {
            this._panelbuttonstoggle.destroy(); // this should restore Activities button
            this._panelbuttonstoggle = null;
        }
        this.emit('destroy');
        _D('<');
    },

	_updatePanel: function() {
        _D('>' + this.__name__ + '._updatePanel()');
		if (global.yawl && global.yawl.panelApps) {
			global.yawl.panelApps.updatePanel(false);
		}
        _D('<');
	},

    _updateActivities: function() {
        _D('>' + this.__name__ + '._updateActivities()');
        if (!global.yawl) {
            _D('global.yawl == null');
            _D('<');
            return;
        }
        let (hideActivities = global.yawl._hideActivities) {
            // GNOME Shell 3.8+: Hot Corner is not contained in Activities button anymore, no need to "preserve" it
            if (dbFinConsts.arrayShellVersion[0] == 3 && dbFinConsts.arrayShellVersion[1] == 6) {
                if (hideActivities && global.yawl._preserveHotCorner) {
                    if (!this._hotcorner) this._hotcorner = new dbFinHotCorner();
                }
                else if (this._hotcorner) {
                    this._hotcorner.destroy();
                    this._hotcorner = null;
                }
            }
            if (hideActivities) {
                this._panelbuttonstoggle.hide('activities', 'left');
            }
            else {
                this._panelbuttonstoggle.restore('activities');
                // make sure the Activities button is the first one
                let (activities = Main.panel && Main.panel.statusArea && Main.panel.statusArea['activities']) {
                    if (activities && activities.container
                        && Main.panel._leftBox === activities.container.get_parent()) {
                        Main.panel._leftBox.set_child_at_index(activities.container, 0);
                    }
                }
            }
        }
        _D('<');
    },

    _updatedHideAppMenu: function () {
        _D('>' + this.__name__ + '._updatedHideAppMenu()');
        if (global.yawl._hideAppMenu) this._panelbuttonstoggle.hide('appMenu', 'left');
        else this._panelbuttonstoggle.restore('appMenu');
        _D('<');
    },

	// GNOMENEXT: modified from ui/panel.js: class Panel
    _allocate: function (actor, box, flags) {
        _D('@' + this.__name__ + '._allocate()');
        if (!Main.panel || !global.yawl) {
            _D('<');
            return;
        }
		let (   w = box.x2 - box.x1, // what do we have?
                h = box.y2 - box.y1,
                [wlm, wln] = Main.panel._leftBox && Main.panel._leftBox.get_stage() ? Main.panel._leftBox.get_preferred_width(-1) : [ 0, 0 ], // minimum and natural widths
		     	[wym, wyn] = Main.panel._yawlPanel && Main.panel._yawlPanel.get_stage() ? Main.panel._yawlPanel.get_preferred_width(-1) : [ 0, 0 ],
                [wcm, wcn] = Main.panel._centerBox && Main.panel._centerBox.get_stage() ? Main.panel._centerBox.get_preferred_width(-1) : [ 0, 0 ],
                [wrm, wrn] = Main.panel._rightBox && Main.panel._rightBox.get_stage() ? Main.panel._rightBox.get_preferred_width(-1) : [ 0, 0 ],
                boxChild = new Clutter.ActorBox(),
                drl = (Main.panel.actor.get_text_direction() == Clutter.TextDirection.RTL)) {
			if (!wym && Main.panel._yawlPanel) wym = Main.panel._yawlPanel._box.get_n_children();
			let (wly, wl, wy, wr, xl, xr) {
				if (global.yawl._moveCenter) {
					// let left box + YAWL panel occupy all the space on the left, but no less than (w - wcn) / 2
					// let right box occupy as much as it needs on the right, but no more than (w - wcn) / 2
					wly = Math.max(w - wcn - wrn, Math.ceil((w - wcn) / 2));
					wr = Math.min(wrn, Math.floor((w - wcn) / 2));
				}
				else {
					wly = Math.ceil((w - wcn) / 2);
					wr = Math.floor((w - wcn) / 2);
				}
				wl = Math.max(wlm, Math.min(Math.floor(w * global.yawl._yawlPanelPosition / 100), wly - wym));
				wy = Math.max(wym, Math.min(wly - wl, Math.floor(w * global.yawl._yawlPanelWidth / 100)));
				wly = Math.max(wly, wl + wy);
				[ xl, xr ] = drl ? [ w, w ] : [ 0, 0 ];
				if (wl) {
					if (drl) xl -= wl; else xr = wl;
					dbFinUtils.setBox(boxChild, xl, 0, xr, h);
					Main.panel._leftBox.allocate(boxChild, flags);
				}
				if (Main.panel._yawlPanel && wy) {
					if (drl) { xr = xl; xl -= wy; } else { xl = xr; xr += wy; }
					dbFinUtils.setBox(boxChild, xl, 0, xr, h);
					Main.panel._yawlPanel.allocate(boxChild, flags);
				}
				if (wcn) {
					if (drl) { xr = w - wly; xl = xr - wcn; } else { xl = wly; xr = xl + wcn; }
					dbFinUtils.setBox(boxChild, xl, 0, xr, h);
					Main.panel._centerBox.allocate(boxChild, flags);
				}
				if (wrn) {
					if (drl) { xr = Math.min(wrn, xl); xl = 0; } else { xl = Math.max(w - wrn, xr); xr = w; }
					dbFinUtils.setBox(boxChild, xl, 0, xr, h);
					Main.panel._rightBox.allocate(boxChild, flags);
				}
				// Who needs the corners?.. Well, maybe someone does.
				// But we do not need to reallocate them
			} // let (wly, wl, wy, wr, xl, xr)
		} // let (w, h, wlm, wln, wym, wyn, wcm, wcn, wrm, wrn, boxChild, drl)
        _D('<');
    }
});
Signals.addSignalMethods(dbFinMoveCenter.prototype);
