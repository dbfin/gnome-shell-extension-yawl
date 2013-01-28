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

const dbFinDebug = Me.imports.dbfindebug;
const _D = dbFinDebug._D;

function init() {
    _D('Initializing YAWL extension preferences...');
    Convenience.initTranslations();
    _D('YAWL extension preferences initialized');
}

function buildPrefsWidget() {
    var widget = new Gtk.Grid();
    widget.margin = widget.row_spacing = widget.column_spacing = 10;

    let label = new Gtk.Label({ label: '<b>' + _("Hello!") + '</b>', use_markup: true, wrap: true });
    widget.attach(label, 0, 1, 1, 1);

    let entry = new Gtk.Entry({ hexpand: true });
    widget.attach(entry, 1, 1, 1, 1);

    widget._settings = Convenience.getSettings();
    widget._settings.bind('panel-name', entry, 'text', Gio.SettingsBindFlags.DEFAULT);

    widget.show_all();
    return widget;
}
