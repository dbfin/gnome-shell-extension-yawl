/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinmovecenter.js
 * Move central panel to the right.
 *
 */

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;

const Main = imports.ui.main;
const Panel = imports.ui.panel;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinPanelButtonToggle = Me.imports.dbfinpanelbuttontoggle;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinUtils = Me.imports.dbfinutils;
const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

// GNOMENEXT: ui/panel.js: class ActivitiesButton
const dbFinHotCorner = new Lang.Class({
	Name: 'dbFin.HotCorner',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
		this._button = new Panel.ActivitiesButton();
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
			Main.panel['_leftBox'].remove_actor(this._button.container);
			this._button.destroy();
			this._button = null;
		}
        _D('<');
	},

	_getPreferredSize: function(actor, forSize, alloc) {
        _D('@' + this.__name__ + '._getPreferredSize()'); // This is called whenever GS needs to reallocate the button, debug will cause lots of records
		[ alloc.min_size, alloc.natural_size ] = [ 1, 1 ];
		_D('<');
	},

	_allocate: function(actor, box, flags) {
        _D('@' + this.__name__ + '._allocate()'); // This is called whenever GS needs to reallocate the button, debug will cause lots of records
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
        _D('@' + this.__name__ + '._styleChanged()'); // This is called whenever the style of the button changes, debug will cause lots of records
		this._button._minHPadding = 0;
		this._button._natHPadding = 0;
		_D('<');
	}
});

const dbFinMoveCenter = new Lang.Class({
    Name: 'dbFin.MoveCenter',

    _init: function() {
        _D('>' + this.__name__ + '._init()');
        this._settings = Convenience.getSettings();
		this._signals = new dbFinSignals.dbFinSignals();
		this._panelbuttonstoggle = new dbFinPanelButtonToggle.dbFinPanelButtonToggle();
		this._hotcorner = null;
		this._signals.connectNoId({ emitter: Main.panel.actor, signal: 'allocate',
									callback: this._allocate, scope: this });

        dbFinUtils.settingsVariable(this, 'yawl-panel-position', 21, { min: 0, max: 50 }, this._updatePanel );
        dbFinUtils.settingsVariable(this, 'yawl-panel-width', 100, { min: 1, max: 100 }, this._updatePanel );
        dbFinUtils.settingsVariable(this, 'icons-align-center', false, null, this._updatePanel );
        dbFinUtils.settingsVariable(this, 'move-center', false, null, this._updatePanel );
        dbFinUtils.settingsVariable(this, 'hide-activities', false); // callback: _updatedHideActivities
        dbFinUtils.settingsVariable(this, 'preserve-hot-corner', false, null, this._updatedHideActivities);
        dbFinUtils.settingsVariable(this, 'hide-app-menu', false, null, function () {
            if (this._hideAppMenu) this._panelbuttonstoggle.hide('appMenu', 'left');
            else this._panelbuttonstoggle.restore('appMenu');
        });

		this._updatePanel();
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
        this._settings = null;
        _D('<');
    },

	_updatePanel: function() {
        _D('>' + this.__name__ + '._updatePanel()');
		if (Main.panel) Main.panel.actor.queue_relayout();
        _D('<');
	},

    _updatedHideActivities: function() {
        _D('>' + this.__name__ + '._updatedHideActivities()');
		if (this._hideActivities && this._preserveHotCorner) {
			if (!this._hotcorner) this._hotcorner = new dbFinHotCorner();
		}
		else if (this._hotcorner) {
			this._hotcorner.destroy();
			this._hotcorner = null;
		}
		if (this._hideActivities) this._panelbuttonstoggle.hide('activities', 'left');
		else this._panelbuttonstoggle.restore('activities');
        _D('<');
    },

	// GNOMENEXT: modified from ui/panel.js: class Panel
    _allocate: function (actor, box, flags) {
        _D('@' + this.__name__ + '._allocate()'); // This is called whenever GS needs to reallocate the panel, debug will cause lots of records
		let (   w = box.x2 - box.x1, // what do we have?
                h = box.y2 - box.y1,
                [wlm, wln] = Main.panel._leftBox.get_preferred_width(-1), // minimum and natural widths
		     	[wym, wyn] = Main.panel._yawlBox ? Main.panel._yawlBox.get_preferred_width(-1) : [ 0, 0 ],
                [wcm, wcn] = Main.panel._centerBox.get_preferred_width(-1),
                [wrm, wrn] = Main.panel._rightBox.get_preferred_width(-1),
                boxChild = new Clutter.ActorBox(),
                drl = (Main.panel.actor.get_text_direction() == Clutter.TextDirection.RTL)) {
			if (!wym && Main.panel._yawlBox) wym = Main.panel._yawlBox.get_n_children();
			let (wly, wl, wy, wr, xl, xr) {
				if (this._moveCenter) {
					// let left box + YAWL panel occupy all the space on the left, but no less than (w - wcn) / 2
					// let right box occupy as much as it needs on the right, but no more than (w - wcn) / 2
					wly = Math.max(w - wcn - wrn, Math.ceil((w - wcn) / 2));
					wr = Math.min(wrn, Math.floor((w - wcn) / 2));
				}
				else {
					wly = Math.ceil((w - wcn) / 2);
					wr = Math.floor((w - wcn) / 2);
				}
				wl = Math.max(wlm, Math.min(Math.floor(w * this._yawlPanelPosition / 100), wly - wym));
				wy = Math.max(wym, Math.min(wly - wl, Math.floor(w * this._yawlPanelWidth / 100)));
				wly = Math.max(wly, wl + wy);
				[ xl, xr ] = drl ? [ w, w ] : [ 0, 0 ];
				if (wl) {
					if (drl) xl = w - wl; else xr = wl;
					dbFinUtils.setBox(boxChild, xl, 0, xr, h);
					Main.panel._leftBox.allocate(boxChild, flags);
				}
				if (Main.panel._yawlBox && wy) {
					if (drl) { xr = xl; xl -= wy; } else { xl = xr; xr += wy; }
                    if (this._iconsAlignCenter && wy - wyn > 1) { xl += (wy - wyn) >> 1; xr = xl + wyn; }
					dbFinUtils.setBox(boxChild, xl, 0, xr, h);
					Main.panel._yawlBox.allocate(boxChild, flags);
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
		} // let (w, h, wlm, wln, wcm, wcn, wrm, wrn, boxChild, drl)
        _D('<');
    }
});
