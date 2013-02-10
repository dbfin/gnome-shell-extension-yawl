/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinutilsprefs.js
 * Common utilities for preferences.
 *
 * 1) functions
 *
 * 2) classes
 *	dbFinSettingsBindEntry	this is a helper class to synchronize GSettings::string, gtkEntry and gtkWidget
 *		Methods:
 *			bind(settingsKey, gtkEntry, gtkWidget, gtkWidgetNotifySignal, callbackWidgetToEntry, callbackEntryToWidget)
 *							binds GSettings string key, gtkEntry and gtkWidget's property
 *
 * dbFinSettingsBindEntryColorButton  this is a helper class to synchronize GSettings::string, gtkEntry and gtkColorButton::rgba
 *		Methods:
 *			bind(settingsKey, gtkEntry, gtkColorButton)
 *							binds GSettings string key, gtkEntry and gtkColorButton
 *
 * dbFinSettingsBindEntryScale  this is a helper class to synchronize GSettings::string, gtkEntry and gtkScale::value
 *		Methods:
 *			bind(settingsKey, gtkEntry, gtkScale)
 *							binds GSettings string key, gtkEntry and gtkScale
 *
 */

const Lang = imports.lang;

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

/* class dbFinSettingsBindEntry: this is a helper class to synchronize GSettings::string, gtkEntry and gtkWidget
 */
const dbFinSettingsBindEntry = new Lang.Class({
	Name: 'dbFin.SettingsBindEntry',

	_init: function() {
		this._settings = Convenience.getSettings();
		this._settingsKey = null;
		this._gtkEntry = null;
		this._gtkWidget = null;
		this._gtkWidgetNotifySignal = null;
		this._signalEntry = null;
		this._signalWidget = null;
		this._callbackWidgetToEntry = null;
		this._callbackEntryToWidget = null;
	},

	destroy: function() {
		if (this._settingsKey) {
			if (this._settings && this._gtkEntry) this._settings.unbind(this._gtkEntry, 'text');
			this._settingsKey = null;
		}
		this._disconnectEntry();
		this._disconnectWidget();
		this._gtkEntry = null;
		this._gtkWidget = null;
		this._gtkWidgetNotifySignal = null;
		this._callbackWidgetToEntry = null;
		this._callbackEntryToWidget = null;
        this._settings = null;
	},

	bind: function(settingsKey, gtkEntry, gtkWidget, gtkWidgetNotifySignal, callbackWidgetToEntry, callbackEntryToWidget) {
		this._settingsKey = '' + settingsKey;
        this._gtkEntry = gtkEntry;
		this._gtkWidget = gtkWidget;
		this._gtkWidgetNotifySignal = '' + gtkWidgetNotifySignal;
		this._callbackWidgetToEntry = callbackWidgetToEntry;
		this._callbackEntryToWidget = callbackEntryToWidget;
		this._gtkEntry.set_text(this._settings.get_string(this._settingsKey));
		this._callbackEntryToWidget();
		this._settings.bind(this._settingsKey, this._gtkEntry, 'text', Gio.SettingsBindFlags.DEFAULT);
		this._connectEntry();
		this._connectWidget();
	},

	_connectEntry: function() {
		if (!this._signalEntry && this._gtkEntry && this._callbackEntryToWidget) {
			this._signalEntry = this._gtkEntry.connect('notify::text', this._callbackEntryToWidget);
		}
	},

	_disconnectEntry: function() {
		if (this._signalEntry) {
			if (this._gtkEntry) this._gtkEntry.disconnect(this._signalEntry);
			this._signalEntry = null;
		}
	},

	_connectWidget: function() {
		if (!this._signalWidget && this._gtkWidget && this._gtkWidgetNotifySignal && this._callbackWidgetToEntry) {
			this._signalWidget = this._gtkWidget.connect(this._gtkWidgetNotifySignal, this._callbackWidgetToEntry);
		}
	},

	_disconnectWidget: function() {
		if (this._signalWidget) {
			if (this._gtkWidget) this._gtkWidget.disconnect(this._signalWidget);
			this._signalWidget = null;
		}
	}
});

/* class dbFinSettingsBindEntryColorButton: this is a helper class to synchronize GSettings::string, gtkEntry and gtkColorButton::rgba
 */
const dbFinSettingsBindEntryColorButton = new Lang.Class({
	Name: 'dbFin.SettingsBindEntryColorButton',
	Extends: dbFinSettingsBindEntry,

	_init: function() {
		this.parent();
	},

	destroy: function() {
		this.parent();
	},

	bind: function(settingsKey, gtkEntry, gtkColorButton) {
		this.parent(settingsKey, gtkEntry, gtkColorButton, 'notify::color',
		            Lang.bind(this, this._updateEntry), Lang.bind(this, this._updateColorButton));
	},

	_updateEntry: function() {
		if (this._gtkEntry && this._gtkWidget) {
			this._disconnectEntry();
			let (rgba = new Gdk.RGBA()) {
				this._gtkWidget.get_rgba(rgba);
				let (rgbacss = rgba.to_string()) {
					let (	rgbaarray = rgbacss.replace(/^\s*rgba?\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+).*$/, '$1,$2,$3').split(','),
							s = '#') {
						for (let i = 0; i < 3; ++i) {
							let (c = parseInt(rgbaarray[i])) {
								s = s + (c < 16 ? '0' + c.toString(16) : c.toString(16));
							}
						}
						this._gtkEntry.set_text(s);
					} // let (rgbaarray, s)
				} // let (rgbacss)
			} // let(rgba)
			this._connectEntry();
		} // if (this._gtkEntry && this._gtkWidget)
	},

	_updateColorButton: function() {
		if (this._gtkEntry && this._gtkWidget) {
			this._disconnectWidget();
			let (rgba = new Gdk.RGBA()) {
				rgba.parse(this._gtkEntry.get_text());
				this._gtkWidget.set_rgba(rgba);
			}
			this._connectWidget();
		} // if (this._gtkEntry && this._gtkWidget)
	}
});

/* class dbFinSettingsBindEntryScale: this is a helper class to synchronize GSettings::string, gtkEntry and gtkScale::value
 */
const dbFinSettingsBindEntryScale = new Lang.Class({
	Name: 'dbFin.SettingsBindEntryScale',
	Extends: dbFinSettingsBindEntry,

	_init: function() {
		this.parent();
	},

	destroy: function() {
		this.parent();
	},

	bind: function(settingsKey, gtkEntry, gtkScale) {
		this.parent(settingsKey, gtkEntry, gtkScale, 'value-changed',
		            Lang.bind(this, this._updateEntry), Lang.bind(this, this._updateScale));
	},

	_updateEntry: function() {
		if (this._gtkEntry && this._gtkWidget) {
			this._disconnectEntry();
			this._gtkEntry.set_text('' + this._gtkWidget.get_value());
			this._connectEntry();
		} // if (this._gtkEntry && this._gtkWidget)
	},

	_updateScale: function() {
		if (this._gtkEntry && this._gtkWidget) {
			this._disconnectWidget();
			this._gtkWidget.set_value(parseFloat(this._gtkEntry.get_text()));
			this._connectWidget();
		} // if (this._gtkEntry && this._gtkWidget)
	}
});
