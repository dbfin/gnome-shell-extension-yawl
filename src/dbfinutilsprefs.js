/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 *
 * Copyright (C) 2013 Vadim Cherepanov @ dbFin <vadim@dbfin.com>
 *
 * Yet Another Window List (YAWL) Gnome-Shell extension is
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
 * dbFinSettingsBindEntryComboBoxText  this is a helper class to synchronize GSettings::string, gtkEntry and gtkComboBoxText::value
 *		Methods:
 *			bind(settingsKey, gtkEntry, gtkComboBoxText)
 *							binds GSettings string key, gtkEntry and gtkComboBoxText
 *
 * dbFinSettingsWidgetBuilder	this is a helper class to build settings widget
 * 		Methods:
 *          getWidget()
 *          shift()
 *          unshift()
 *			addNotebook(label?, iconfile?, bindSensitive?)
 *			closeNotebook()
 * 			addPage(label, iconfile?, bindSensitive?)
 * 			addWidget(gtkWidget, x, y, w, h, bindSensitive?)
 * 			addRow(gtkWidget?, [gtkOthers], bindSensitive?)
 *          addSeparator()
 *          addLabel(label, bindSensitive?, markup?, justify=0, rightmargin=0)
 *          addCheckBox(label, settingsKey, bindSensitive?)
 *          addColorButton(label, settingsKey, titleColorChooser, bindSensitive?, showEntry?)
 *          addScale(label, settingsKey, min, max, step, bindSensitive?, showEntry?)
 * 			addScaleScale(label, settingsKey1, settingsKey2, min1, max1, step1, min2, max2, step2, bindSensitive?, showEntry1?, showEntry2?)
 * 			addColorButtonScale(label, settingsKeyColor, settingsKeyScale, titleColorChooser, min, max, step, bindSensitive?, showEntryColor?, showEntryScale?)
 *          addComboBoxText(label, settingsKey, arrayLabels, subIndex, bindSensitive?, showEntry?)
 *
 */

const Lang = imports.lang;

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
const dbFinSettings = Me.imports.dbfinsettings;
const dbFinSignals = Me.imports.dbfinsignals;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

/* class dbFinSettingsBindEntry: this is a helper class to synchronize GSettings::string, gtkEntry and gtkWidget
 */
const dbFinSettingsBindEntry = new Lang.Class({
	Name: 'dbFin.SettingsBindEntry',

	_init: function() {
        this._signals = new dbFinSignals.dbFinSignals();
		this._settings = Convenience.getSettings();
		this._settingsKey = null;
		this._gtkEntry = null;
		this._gtkWidget = null;
		this._gtkWidgetNotifySignal = null;
		this._callbackWidgetToEntry = null;
		this._callbackEntryToWidget = null;
	},

	destroy: function() {
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
		if (this._settingsKey) {
			if (this._settings && this._gtkEntry) this._settings.unbind(this._gtkEntry, 'text');
			this._settingsKey = null;
		}
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
        let (text = dbFinSettings.dbFinSettings.prototype.getString(this._settingsKey, null, {}, this._settings)) {
    		if (text === null) return;
            this._gtkEntry.set_text(text);
        }
		if (this._callbackEntryToWidget) this._callbackEntryToWidget();
        if (this._settingsKey && this._settings && this._gtkEntry)
            this._settings.bind(this._settingsKey, this._gtkEntry, 'text', Gio.SettingsBindFlags.DEFAULT);
		this._connectEntry();
		this._connectWidget();
	},

	_connectEntry: function() {
        this._signals.connectId('entry', {  emitter: this._gtkEntry, signal: 'notify::text',
                                            callback: this._callbackEntryToWidget, scope: this });
	},

	_disconnectEntry: function() {
        this._signals.disconnectId('entry');
	},

	_connectWidget: function() {
        this._signals.connectId('widget', { emitter: this._gtkWidget, signal: this._gtkWidgetNotifySignal,
                                            callback: this._callbackWidgetToEntry, scope: this });
	},

	_disconnectWidget: function() {
        this._signals.disconnectId('widget');
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
		this.parent(settingsKey, gtkEntry, gtkColorButton, 'notify::rgba',
		            Lang.bind(this, this._updateEntry), Lang.bind(this, this._updateColorButton));
	},

	_updateEntry: function() {
		if (this._gtkEntry && this._gtkWidget) {
			this._disconnectEntry();
			// Since 3.8 (or 3.6.3.1?) Gtk.ColorButton.get_rgba() has changed
			// from changing RGBA value by reference to returning new RGBA value
			let (rgba36 = new Gdk.RGBA(), rgba = null) {
				rgba = this._gtkWidget.get_rgba(rgba36);
				if (!(rgba instanceof Gdk.RGBA)) rgba = rgba36;
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
			} // let(rgba36, rgba)
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

/* class dbFinSettingsBindEntryComboBoxText: this is a helper class to synchronize GSettings::string, gtkEntry and gtkComboBoxText::value
 */
const dbFinSettingsBindEntryComboBoxText = new Lang.Class({
	Name: 'dbFin.SettingsBindEntryComboBoxText',
	Extends: dbFinSettingsBindEntry,

	_init: function() {
		this.parent();
	},

	destroy: function() {
		this.parent();
	},

	bind: function(settingsKey, gtkEntry, gtkComboBoxText) {
		this.parent(settingsKey, gtkEntry, gtkComboBoxText, 'changed',
		            Lang.bind(this, this._updateEntry), Lang.bind(this, this._updateComboBoxText));
	},

	_updateEntry: function() {
		if (this._gtkEntry && this._gtkWidget) {
			this._disconnectEntry();
			this._gtkEntry.set_text('' + this._gtkWidget.get_active());
			this._connectEntry();
		} // if (this._gtkEntry && this._gtkWidget)
	},

	_updateComboBoxText: function() {
		if (this._gtkEntry && this._gtkWidget) {
			this._disconnectWidget();
			let (i = parseInt(this._gtkEntry.get_text())) {
				if (!isNaN(i)) this._gtkWidget.set_active(i);
			}
			this._connectWidget();
		} // if (this._gtkEntry && this._gtkWidget)
	}
});

/* dbFinSettingsWidgetBuilder	this is a helper class to build settings widget
 */
const dbFinSettingsWidgetBuilder = new Lang.Class({
    Name: 'dbFin.SettingsWidgetBuilder',

    _init: function(notebooksPagesCircle/* = false*/) {
        this._settings = Convenience.getSettings();
        this._notebooks = [];
        this._notebook = null;
        this._notebooksPagesCircle = notebooksPagesCircle || false;
    },

    destroy: function() {
		this._settings = null;
    },

    getWidget: function() {
        return this._notebooks && this._notebooks.length ? this._notebooks[0].widget : null;
    },

	shift: function() {
        if (this._notebook) this._notebook.shift++;
	},

	unshift: function() {
        if (this._notebook && this._notebook.shift) this._notebook.shift--;
	},

	setWidthRight: function(widthRight) {
        if (this._notebook) {
            this._notebook.widthRight = widthRight
                    || this._notebook.parent && this._notebook.parent.widthRight
                    || 4;
        }
	},

	// bindSensitive = '[!]key'
	addNotebook: function(label/* = null*/, iconfile/* = null*/, bindSensitive/* = null*/) {
        let (notebook = new Gtk.Notebook({  hexpand:	true,
											vexpand:	true,
											halign:		Gtk.Align.FILL,
											valign:		Gtk.Align.FILL,
                                            tab_pos:    this._notebooksPagesCircle
                                                        ? (this._notebooks.length * 3 + 2) % 5 // why not? ;)
                                                        : this._notebooks.length == 1 ? 0 : 2 })) {
			if (this._notebook && this._notebook.page) {
				this._notebook.page.attach(notebook,
				                           this._notebook.shift, this._notebook.row,
				                           this._notebook.width - this._notebook.shift, 1);
            }
			this._notebook = { parent: this._notebook };
			this._notebook.widget = notebook;
	        this._notebook.widget._settingsbinds = [];
			notebook.show();
        }
		this._notebooks.push(this._notebook);
		this._notebook.width = this._notebooksPagesCircle // new this._notebooks length
				? 10 - Math.floor(this._notebooks.length / 2)
				: 11 - Math.min(this._notebooks.length, 2);
		this.setWidthRight();
		this._notebook.page = null;
		this._notebook.row = 0;
		this._notebook.shift = 0;
        if (label) this.addPage(label, iconfile);
		if (bindSensitive && this._notebook) {
			this._settings.bind((bindSensitive[0] == '!'	? bindSensitive.substring(1)
															: bindSensitive),
								this._notebook,
								'sensitive',
								(bindSensitive[0] == '!'	? Gio.SettingsBindFlags.INVERT_BOOLEAN
															: Gio.SettingsBindFlags.DEFAULT));
		}
	},

	closeNotebook: function() {
		if (this._notebooks.length > 1) { // never close top notebook
			this._notebooks.pop();
			this._notebook = this._notebooks[this._notebooks.length - 1];
		}
	},

	// bindSensitive = '[!]key'
	addPage: function(label, iconfile/* = null*/, bindSensitive/* = null*/) {
		if (!this._notebook) return;
        let (page = new Gtk.Grid({	hexpand:			true,
									halign:				Gtk.Align.FILL,
									valign:				Gtk.Align.FILL,
									margin:				7,
									row_spacing:		7,
									column_spacing:		7,
									column_homogeneous:	true }),
             pageLabel = new Gtk.Label({ label: label }),
             pageLabelBox = (this._notebooksPagesCircle
                             ? (this._notebooks.length & 1 ? new Gtk.HBox() : new Gtk.VBox())
                             : (this._notebooks.length != 2 ? new Gtk.HBox() : new Gtk.VBox()))) {
			pageLabelBox.margin = this._notebooksPagesCircle
							? (this._notebooks.length & 1 ? 3 : 7)
							: (this._notebooks.length != 2 ? 3 : 7);
			pageLabelBox.spacing = 3;
			pageLabelBox.homogeneous = false;
			pageLabelBox.pack_end(pageLabel, /*expand =*/true, /*fill =*/true, /*padding =*/0);
			if (iconfile) {
				let (pageImage = Gtk.Image.new_from_file(Me.path + '/images/' + iconfile)) {
					pageLabelBox.pack_start(pageImage, /*expand =*/true, /*fill =*/true, /*padding =*/0);
				}
			}
			pageLabelBox.show_all();
			this._notebook.widget.append_page(/*child = */page, /*tab_label = */pageLabelBox);
            this._notebook.page = page;
            this._notebook.row = 0;
			this._notebook.shift = 0;
            page.show();
			if (bindSensitive && this._notebook.page) {
				this._settings.bind((bindSensitive[0] == '!'	? bindSensitive.substring(1)
																: bindSensitive),
									this._notebook.page,
									'sensitive',
									(bindSensitive[0] == '!'	? Gio.SettingsBindFlags.INVERT_BOOLEAN
																: Gio.SettingsBindFlags.DEFAULT));
			}
        }
    },

	// gtkWidget = Gtk.Widget or a string for Gtk.Label
	// bindSensitive = either '[@][!]key' or array of '[@][!]key''s
	addWidget: function(gtkWidget, x, y, w, h, bindSensitive/* = null*/) {
		if (!gtkWidget || !this._notebook || !this._notebook.page) return [];
		if (!(gtkWidget instanceof Gtk.Widget)) {
			let (label = '' + gtkWidget) {
				gtkWidget = new Gtk.Label({ halign: Gtk.Align.START, valign: Gtk.Align.CENTER, hexpand: true });
				gtkWidget.set_markup(label);
			}
		}
		let (binds = bindSensitive && typeof bindSensitive == 'string' ? [ bindSensitive ] : bindSensitive || []) {
			if (!w || w < 0 || !h || h < 0) {
				this._notebook.page.attach(gtkWidget, x, y, 1, 1);
				gtkWidget.sensitive = false;
				gtkWidget.hide();
			} // if (!w || w < 0 || !h || h < 0)
			else {
				let (bindBox = null, bind = '', bindVisibility = false) {
					for (let j = 0; j < binds.length; ++j) {
                        bind = binds[j];
						bindVisibility = bind && bind[0] == '@';
						if (bindVisibility) bind = bind.substring(1);
						let (bindInverse = bind && bind[0] == '!'	? Gio.SettingsBindFlags.INVERT_BOOLEAN
																	: Gio.SettingsBindFlags.DEFAULT,
							 bindKey = bind && bind[0] == '!' ? bind.substring(1) : bind,
							 bindBoxNew = new Gtk.Box({	hexpand:	true,
														halign:		Gtk.Align.FILL,
														valign:		Gtk.Align.CENTER })) {
							if (!bindBox) this._notebook.page.attach(bindBoxNew, x, y, w, h);
							else bindBox.pack_end(bindBoxNew, /*expand =*/true, /*fill =*/true, /*padding =*/0);
							bindBoxNew.show();
							this._settings.bind(bindKey, bindBoxNew, bindVisibility ? 'visible' : 'sensitive', bindInverse);
							bindBox = bindBoxNew;
						} // let (bindInverse, bindKey, bindBoxNew)
					} // for (let j)
					if (!bindBox) this._notebook.page.attach(gtkWidget, x, y, w, h);
					else bindBox.pack_end(gtkWidget, /*expand =*/true, /*fill =*/true, /*padding =*/0);
					gtkWidget.show();
				} // let (bindBox)
			} // if (!w || w < 0 || !h || h < 0) else
		} // let (binds)
		return [ gtkWidget ];
	},

	// gtkWidget = Gtk.Widget or a string for Gtk.Label
	// gtkOthers = [ [ gtkWidget, width ] ]
	// bindSensitive = either '[@][!]key' or array of '[@][!]key''s
	addRow: function(gtkWidget/* = null*/, gtkOthers/* = []*/, bindSensitive/* = null*/) {
		if (!this._notebook || !this._notebook.page) return [];
		if (gtkWidget && !(gtkWidget instanceof Gtk.Widget) || gtkWidget === '') {
			let (label = '' + gtkWidget) {
				gtkWidget = new Gtk.Label({ halign: Gtk.Align.START, valign: Gtk.Align.CENTER,
											xalign: 0.0, yalign: 0.5, hexpand: true });
				if (gtkWidget) {
					gtkWidget.set_markup(label);
					gtkWidget.set_line_wrap(true);
				}
			}
		}
		let (binds = bindSensitive && typeof bindSensitive == 'string' ? [ bindSensitive ] : bindSensitive || [],
		     x = this._notebook.shift,
		     widgets = []) {
			gtkOthers = gtkOthers || [];
			let (w = this._notebook.width - x) {
				for (let i = 0; i < gtkOthers.length; ++i) w -= gtkOthers[i][1];
				gtkOthers.unshift([ gtkWidget, w ]);
			} // let (w)
			for (let i = 0; i < gtkOthers.length; ++i) {
				if (gtkOthers[i][0]) {
					widgets.push(gtkOthers[i][0]);
					if (!gtkOthers[i][1] || gtkOthers[i][1] < 0) {
						this._notebook.page.attach(gtkOthers[i][0], x, this._notebook.row, 1, 1);
						gtkOthers[i][0].sensitive = false;
						gtkOthers[i][0].hide();
					} // if (!gtkOthers[i][1] || gtkOthers[i][1] < 0)
					else {
						let (bindBox = null, bind = '', bindVisibility = false) {
							for (let j = 0; j < binds.length; ++j) {
                                bind = binds[j];
								bindVisibility = bind && bind[0] == '@';
								if (bindVisibility) bind = bind.substring(1);
								let (bindInverse = bind && bind[0] == '!'	? Gio.SettingsBindFlags.INVERT_BOOLEAN
																			: Gio.SettingsBindFlags.DEFAULT,
									 bindKey = bind && bind[0] == '!' ? bind.substring(1) : bind,
									 bindBoxNew = new Gtk.Box({	hexpand:	true,
																halign:		Gtk.Align.FILL,
																valign:		Gtk.Align.CENTER })) {
									if (!bindBox) this._notebook.page.attach(bindBoxNew, x, this._notebook.row, gtkOthers[i][1], 1);
									else bindBox.pack_end(bindBoxNew, /*expand =*/true, /*fill =*/true, /*padding =*/0);
									bindBoxNew.show();
									this._settings.bind(bindKey, bindBoxNew, bindVisibility ? 'visible' : 'sensitive', bindInverse);
									bindBox = bindBoxNew;
								} // let (bindInverse, bindKey, bindBoxNew)
							} // for (let j)
							if (!bindBox) this._notebook.page.attach(gtkOthers[i][0], x, this._notebook.row, gtkOthers[i][1], 1);
							else bindBox.pack_end(gtkOthers[i][0], /*expand =*/true, /*fill =*/true, /*padding =*/0);
							gtkOthers[i][0].show();
						} // let (bindBox)
					} // if (!gtkOthers[i][1] || gtkOthers[i][1] < 0) else
				} // if (gtkOthers[i][0])
				x += gtkOthers[i][1];
			} // for (let i)
			this._notebook.row++; // whether something was added or not
			return widgets;
		} // let (binds, x, widgets)
	},

    addSeparator: function() {
		if (!this._notebook) return [];
		return this.addRow(new Gtk.Separator({ hexpand: true }));
    },

    addLabel: function(label, bindSensitive/* = null*/, markup/* = false*/, justify/* = 0*/, rightmargin/* = 0*/) {
		let (widgets = this.addRow('', [ [ null, rightmargin || 0 ] ], bindSensitive)) {
			if (widgets && widgets.length) {
				if (justify) widgets[0].set_justify(justify);
				if (markup) widgets[0].set_markup(label);
				else widgets[0].set_text(label);
			}
			return widgets;
		}
    },

    addCheckBox: function(label, settingsKey, bindSensitive/* = null*/) {
		let (rowSwitch = new Gtk.Switch({ halign: Gtk.Align.START, valign: Gtk.Align.CENTER })) {
			this._settings.bind(settingsKey, rowSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
			return this.addRow(label, [ [ rowSwitch, 1 ], [ null, this._notebook.widthRight - 1 ] ], bindSensitive);
        } // let (rowSwitch)
    },

    addColorButton: function(label, settingsKey, titleColorChooser, bindSensitive/* = null*/, showEntry/* = false*/) {
		if (!this._notebook) return [];
		let (rowColorButtonEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, width_chars: 9 }),
             rowColorButton = new Gtk.ColorButton({ halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, use_alpha: false, title: titleColorChooser }),
		     settingsbind = new dbFinSettingsBindEntryColorButton()) {
			this._notebook.widget._settingsbinds.push(settingsbind);
			settingsbind.bind(settingsKey, rowColorButtonEntry, rowColorButton);
			return this.addRow(label, [ [ rowColorButtonEntry, !showEntry ? 0 : 1 ], [ null, !showEntry ? 0 : (this._notebook.widthRight - 2) ], [ rowColorButton, 1 ] ], bindSensitive);
        } // let (rowColorButtonEntry, rowColorButton, settingsbind)
    },

    addScale: function(label, settingsKey, min, max, step, bindSensitive/* = null*/, showEntry/* = false*/) {
		if (!this._notebook) return [];
		let (rowScaleEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, width_chars: 5 }),
             rowScale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, min, max, step,
                                                 { halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
		     settingsbind = new dbFinSettingsBindEntryScale()) {
			this._notebook.widget._settingsbinds.push(settingsbind);
			settingsbind.bind(settingsKey, rowScaleEntry, rowScale);
			return this.addRow(label, [ [ rowScaleEntry, !showEntry ? 0 : 1 ], [ rowScale, this._notebook.widthRight - (!showEntry ? 0 : 1) ] ], bindSensitive);
        } // let (rowScaleEntry, rowScale, settingsbind)
    },

    addScaleScale: function(label, settingsKey1, settingsKey2, min1, max1, step1, min2, max2, step2, bindSensitive/* = null*/, showEntry1/* = false*/, showEntry2/* = false*/) {
		if (!this._notebook) return [];
		let (rowScaleEntry1 = new Gtk.Entry({ text: '', halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, width_chars: 5 }),
             rowScale1 = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, min1, max1, step1,
                                                  { halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
             rowScaleEntry2 = new Gtk.Entry({ text: '', halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, width_chars: 5 }),
             rowScale2 = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, min2, max2, step2,
                                                  { halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
		     settingsbind1 = new dbFinSettingsBindEntryScale(),
		     settingsbind2 = new dbFinSettingsBindEntryScale()) {
			this._notebook.widget._settingsbinds.push(settingsbind1);
			this._notebook.widget._settingsbinds.push(settingsbind2);
			settingsbind1.bind(settingsKey1, rowScaleEntry1, rowScale1);
			settingsbind2.bind(settingsKey2, rowScaleEntry2, rowScale2);
			return this.addRow(label, [ [ rowScaleEntry1, !showEntry1 ? 0 : 1 ], [ rowScale1, (this._notebook.widthRight >> 1) - (!showEntry1 ? 0 : 1) ], [ null, this._notebook.widthRight & 1 ], [ rowScaleEntry2, !showEntry2 ? 0 : 1 ], [ rowScale2, (this._notebook.widthRight >> 1) - (!showEntry2 ? 0 : 1) ] ], bindSensitive);
        } // let (rowScaleEntry, rowScale, settingsbind)
    },

    addColorButtonScale: function(label, settingsKeyColor, settingsKeyScale, titleColorChooser, min, max, step, bindSensitive/* = null*/, showEntryColor/* = false*/, showEntryScale/* = false*/) {
		if (!this._notebook) return [];
		let (rowColorButtonEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, width_chars: 9 }),
             rowColorButton = new Gtk.ColorButton({ halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, use_alpha: false, title: titleColorChooser }),
             rowScaleEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, width_chars: 5 }),
             rowScale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, min, max, step,
                                                 { halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
		     settingsbindColor = new dbFinSettingsBindEntryColorButton(),
		     settingsbindScale = new dbFinSettingsBindEntryScale()) {
			this._notebook.widget._settingsbinds.push(settingsbindColor);
			this._notebook.widget._settingsbinds.push(settingsbindScale);
			settingsbindColor.bind(settingsKeyColor, rowColorButtonEntry, rowColorButton);
			settingsbindScale.bind(settingsKeyScale, rowScaleEntry, rowScale);
			return this.addRow(label, [ [ rowColorButtonEntry, !showEntryColor ? 0 : 1 ], [ rowColorButton, 1 ], [ rowScaleEntry, !showEntryScale ? 0 : 1 ], [ rowScale, this._notebook.widthRight - 1 - (!showEntryScale ? 0 : 1) - (!showEntryColor ? 0 : 1) ] ], bindSensitive);
        } // let (rowColorButtonEntry, rowColorButton, rowScaleEntry, rowScale, settingsbindColor, settingsbindScale)
    },

	addComboBoxText: function(label, settingsKey, arrayLabels, subIndex, bindSensitive/* = null*/, showEntry/* = false*/) {
		if (!this._notebook) return [];
		let (rowComboBoxTextEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, width_chars: 5 }),
             rowComboBoxText = new Gtk.ComboBoxText({ halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true }),
		     settingsbind = new dbFinSettingsBindEntryComboBoxText()) {
            if (arrayLabels && arrayLabels.length) {
                if (subIndex === undefined || subIndex === null) {
                    for (let i = 0; i < arrayLabels.length; ++i) {
                        if (arrayLabels[i]) {
                            rowComboBoxText.append_text(_('' + arrayLabels[i]));
                        }
                    }
                }
                else {
                    for (let i = 0; i < arrayLabels.length; ++i) {
                        if (arrayLabels[i] && arrayLabels[i].length) {
                            rowComboBoxText.append_text(_('' + arrayLabels[i][subIndex]));
                        }
                    }
                }
            }
			this._notebook.widget._settingsbinds.push(settingsbind);
			settingsbind.bind(settingsKey, rowComboBoxTextEntry, rowComboBoxText);
			return this.addRow(label, [ [ rowComboBoxTextEntry, !showEntry ? 0 : 1 ], [ rowComboBoxText, this._notebook.widthRight - (!showEntry ? 0 : 1) ] ], bindSensitive);
        } // let (rowComboBoxTextEntry, rowComboBoxText, settingsbind)
    }
});
