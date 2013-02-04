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

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinUtils = Me.imports.dbfinutils;
const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const dbFinDebug = Me.imports.dbfindebug;
const _D = dbFinDebug._D;

const dbFinMoveCenter = new Lang.Class({
    Name: 'dbFin.MoveCenter',

    _init: function() {
        _D('>dbFinMoveCenter._init()');
        this._settings = Convenience.getSettings();
		this._signals = new dbFinUtils.Signals();
		this._panelbuttonstoggle = new dbFinUtils.PanelButtonToggle();
        this._moveCenter();
        this._hideActivities();
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::move-center',
                                    callback: this._moveCenter, scope: this });
		this._signals.connectNoId({ emitter: this._settings, signal: 'changed::hide-activities',
                                    callback: this._hideActivities, scope: this });
        _D('<dbFinMoveCenter._init()');
    },

    destroy: function() {
        _D('>dbFinMoveCenter.destroy()');
        if (this._panelbuttonstoggle) {
            this._panelbuttonstoggle.destroy(); // this should restore Activities button
            this._panelbuttonstoggle = null;
        }
        if (this._signals) {
            this._signals.destroy(); // this should disconnect everything and move central panel back
            this._signals = null;
            this._updatePanel();
        }
        this._settings = null;
        _D('<dbFinMoveCenter.destroy()');
    },

	_moveCenter: function () {
        _D('>dbFinMoveCenter._moveCenter()');
        if (this._settings.get_boolean('move-center'))
            this._signals.connectId('panel-allocate', { emitter: Main.panel.actor, signal: 'allocate',
                                                        callback: this._allocate, scope: this });
        else
            this._signals.disconnectId('panel-allocate');
        this._updatePanel();
        _D('<dbFinMoveCenter._moveCenter()');
    },

    _hideActivities: function() {
        _D('>dbFinMoveCenter._hideActivities()');
        if (this._settings.get_boolean('hide-activities')) this._panelbuttonstoggle.hide('activities', 'left');
        else this._panelbuttonstoggle.restore('activities');
        _D('<dbFinMoveCenter._hideActivities()');
    },

	// GNOMENEXT: ui/panel.js, class Panel
	_updatePanel: function() {
        _D('>dbFinMoveCenter._updatePanel()');
		Main.panel._updatePanel();
        _D('<dbFinMoveCenter._updatePanel()');
	},

	// GNOMENEXT: modified from ui/panel.js, class Panel
    _allocate: function (actor, box, flags) {
        //_D('>dbFinMoveCenter._allocate()'); // This is called whenever GS needs to reallocate the panel, debug will cause lots of records
		let (   w = box.x2 - box.x1, // what do we have?
                h = box.y2 - box.y1,
                [wlm, wl] = Main.panel._leftBox.get_preferred_width(-1), // minimum and natural widths
                [wcm, wc] = Main.panel._centerBox.get_preferred_width(-1),
                [wrm, wr] = Main.panel._rightBox.get_preferred_width(-1),
                boxChild = new Clutter.ActorBox(),
                drl = (Main.panel.actor.get_text_direction() == Clutter.TextDirection.RTL)) {
            wl = w - wc - wr; // let left box occupy the rest
            let xl = (drl ? w - wl : 0);
            let xr = xl + wl;
            dbFinUtils.setBox(boxChild, xl, 0, xr, h);
            Main.panel._leftBox.allocate(boxChild, flags);
            if (drl) { xr = xl; xl -= wc; } else { xl = xr; xr += wc; }
            dbFinUtils.setBox(boxChild, xl, 0, xr, h);
            Main.panel._centerBox.allocate(boxChild, flags);
            if (drl) { xr = xl; xl -= wr; } else { xl = xr; xr += wr; }
            dbFinUtils.setBox(boxChild, xl, 0, xr, h);
            Main.panel._rightBox.allocate(boxChild, flags);
			// Who needs the corners?.. Well, maybe someone does.
			// But we do not need to reallocate them
		} // let (w, h, wlm, wl, wcm, wc, wrm, wr, boxChild, drl)
        //_D('<dbFinMoveCenter._allocate()');
    }
});
