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
 * dbFinSettingsWidgetBuilder	this is a helper class to build settings widget
 * 		Methods:
 * 			addPage(label)
 *          addCheckBox(label, settingsKey, bindSensitive)
 *          addColorButton(label, settingsKey, titleColorChooser, bindSensitive)
 *          addScale(label, settingsKey, min, max, step, bindSensitive)
 *          addSeparator()
 *
 */

const Lang = imports.lang;

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

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

/* dbFinSettingsWidgetBuilder	this is a helper class to build settings widget
 */
const dbFinSettingsWidgetBuilder = new Lang.Class({
    Name: 'dbFin.SettingsWidgetBuilder',

    _init: function() {
        this._settings = Convenience.getSettings();
        this.widget = new Gtk.Notebook();
        this.widget._settingsbinds = [];

        this._page = null;
        this._row = 0;
    },

    destroy: function() {
    },

	addPage: function(label) {
        let (page = new Gtk.Grid({ margin: 7, row_spacing: 7, column_spacing: 3, column_homogeneous: true }),
             pageLabel = new Gtk.Label({ label: label })) {
            this.widget.append_page(/* child = */page, /* tab_label = */pageLabel);
            this._page = page;
            this._row = 0;
        }
    },

    addCheckBox: function(label, settingsKey, bindSensitive) {
        if (!this._page) return;
		let (rowLabel = new Gtk.Label({ label: label, halign: Gtk.Align.START, hexpand: true }),
             rowSwitch = new Gtk.Switch({ halign: Gtk.Align.END })) {
            rowSwitch.set_active(this._settings.get_boolean(settingsKey));
			this._settings.bind(settingsKey, rowSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
            if (bindSensitive) {
                this._settings.bind(bindSensitive, rowLabel, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
                this._settings.bind(bindSensitive, rowSwitch, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
            }
            this._page.attach(rowLabel, bindSensitive ? 1 : 0, this._row, bindSensitive ? 6 : 7, 1);
            this._page.attach(rowSwitch, 7, this._row, 1, 1);
            this._row++;
        } // let (rowLabel, rowSwitch)
    },

    addColorButton: function(label, settingsKey, titleColorChooser, bindSensitive) {
        if (!this._page) return;
		let (rowLabel = new Gtk.Label({ label: label, halign: Gtk.Align.START, hexpand: true }),
             rowColorButtonEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.START, hexpand: true, width_chars: 11 }),
             rowColorButton = new Gtk.ColorButton({ halign: Gtk.Align.END, use_alpha: false, title: titleColorChooser }),
		     settingsbind = new dbFinSettingsBindEntryColorButton()) {
			this.widget._settingsbinds.push(settingsbind);
			settingsbind.bind(settingsKey, rowColorButtonEntry, rowColorButton);
            if (bindSensitive) {
                this._settings.bind(bindSensitive, rowLabel, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
                this._settings.bind(bindSensitive, rowColorButtonEntry, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
                this._settings.bind(bindSensitive, rowColorButton, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
            }
            this._page.attach(rowLabel, bindSensitive ? 1 : 0, this._row, bindSensitive ? 4 : 5, 1);
            this._page.attach(rowColorButtonEntry, 5, this._row, 2, 1);
            this._page.attach(rowColorButton, 7, this._row, 1, 1);
            this._row++;
        } // let (rowLabel, rowColorButtonEntry, rowColorButton, settingsbind)
    },

    addScale: function(label, settingsKey, min, max, step, bindSensitive) {
        if (!this._page) return;
		let (rowLabel = new Gtk.Label({ label: label, halign: Gtk.Align.START, hexpand: true }),
             rowScaleEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.START, hexpand: true, width_chars: 5 }),
             rowScale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, min, max, step,
                                                 { halign: Gtk.Align.END, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
		     settingsbind = new dbFinSettingsBindEntryScale()) {
			this.widget._settingsbinds.push(settingsbind);
			settingsbind.bind(settingsKey, rowScaleEntry, rowScale);
            if (bindSensitive) {
                this._settings.bind(bindSensitive, rowLabel, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
                this._settings.bind(bindSensitive, rowScaleEntry, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
                this._settings.bind(bindSensitive, rowScale, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
            }
            this._page.attach(rowLabel, bindSensitive ? 1 : 0, this._row, bindSensitive ? 4 : 5, 1);
            this._page.attach(rowScaleEntry, 5, this._row, 1, 1);
            this._page.attach(rowScale, 6, this._row, 2, 1);
            this._row++;
        } // let (rowLabel, rowScaleEntry, rowScale, settingsbind)
    },

    addSeparator: function() {
        if (!this._page) return;
		let (separator = new Gtk.Separator({ hexpand: true })) {
            this._page.attach(separator, 0, this._row, 8, 1);
            this._row++;
        } // let (separator)
    }
});
