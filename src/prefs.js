/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * prefs.js
 * Extension preferences interface and stuff.
 *
 */

const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

function init() {
    Convenience.initTranslations();
}

function buildPrefsWidget() {
    let widget = new Gtk.Notebook();
    widget._settings = Convenience.getSettings();

	// Panel
	let (pagePanel = new Gtk.Grid({ margin: 7, row_spacing: 7, column_spacing: 7 }),
	     pagePanelLabel = new Gtk.Label({ label: _("Panel") })) {

		// Move clock
		let (panelClockLabel = new Gtk.Label({ label: _("Move clock"), halign: Gtk.Align.START, hexpand: true }),
             panelClockSwitch = new Gtk.Switch({ halign: Gtk.Align.END })) {
            panelClockSwitch.set_active(widget._settings.get_boolean('move-clock'));
			widget._settings.bind('move-clock', panelClockSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
            pagePanel.attach(panelClockLabel, 0, 0, 1, 1);
            pagePanel.attach(panelClockSwitch, 1, 0, 1, 1);
        } // let (panelClockLabel, panelClockSwitch)

		widget.append_page(/* child = */pagePanel, /* tab_label = */pagePanelLabel);
	} // let (pagePanel, pagePanelLabel)

    widget.show_all();
    return widget;
}
