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
 *			addNotebook(label?, iconfile?)
 *			closeNotebook()
 * 			addPage(label, iconfile?)
 *          addSeparator()
 *          addLabel(label, bindSensitive?)
 *          addImages(label, [images], bindSensitive?)
 *          addCheckBox(label, settingsKey, bindSensitive?)
 *          addColorButton(label, settingsKey, titleColorChooser, bindSensitive?)
 *          addScale(label, settingsKey, min, max, step, bindSensitive?)
 *          addComboBoxText(label, settingsKey, arrayLabels, subIndex, bindSensitive?)
 *
 */

const Lang = imports.lang;

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinUtils = Me.imports.dbfinutils;

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
        let (text = dbFinUtils.settingsGetString(this._settings, this._settingsKey, null)) {
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

	addNotebook: function(label/* = null*/, iconfile/* = null*/) {
        let (notebook = new Gtk.Notebook({  vexpand:    true,
                                            tab_pos:    this._notebooksPagesCircle
                                                        ? (this._notebooks.length * 3 + 2) % 5 // why not? ;)
                                                        : 2 - this._notebooks.length % 2 * 2 })) {
			if (this._notebook && this._notebook.page)
				this._notebook.page.attach(notebook,
				                           this._notebook.shift, this._notebook.row,
				                           this._notebook.width - this._notebook.shift, 1);
			this._notebook = {};
			this._notebook.widget = notebook;
	        this._notebook.widget._settingsbinds = [];
			notebook.show();
        }
		this._notebooks.push(this._notebook);
		this._notebook.width = 8 - Math.floor(this._notebooks.length / 2); // new this._notebooks length
		this._notebook.page = null;
		this._notebook.row = 0;
		this._notebook.shift = 0;
        if (label) this.addPage(label, iconfile);
	},

	closeNotebook: function() {
		if (this._notebooks.length > 1) { // never close top notebook
			this._notebooks.pop();
			this._notebook = this._notebooks[this._notebooks.length - 1];
		}
	},

	addPage: function(label, iconfile/* = null*/) {
		if (!this._notebook) return;
        let (page = new Gtk.Grid({ margin: 7, row_spacing: 7, column_spacing: 3, column_homogeneous: true }),
             pageLabel = new Gtk.Label({ label: label }),
             pageLabelBox = (this._notebooks.length & 1 ? new Gtk.HBox() : new Gtk.VBox())) {
			pageLabelBox.margin = this._notebooks.length & 1 ? 3 : 7;
			pageLabelBox.spacing = 3;
			pageLabelBox.homogeneous = false;
			pageLabelBox.pack_end(pageLabel, /*expand =*/true, /*fill =*/true, /*padding =*/0);
			if (iconfile) {
				let (pageImage = new Gtk.Image.new_from_file(Me.path + '/images/' + iconfile)) {
					pageLabelBox.pack_start(pageImage, /*expand =*/true, /*fill =*/true, /*padding =*/0);
				}
			}
			pageLabelBox.show_all();
			this._notebook.widget.append_page(/*child = */page, /*tab_label = */pageLabelBox);
            this._notebook.page = page;
            this._notebook.row = 0;
			this._notebook.shift = 0;
            page.show();
        }
    },

	addRow: function(gtkLabel/* = null*/, gtkOthers/* = []*/, bindSensitive/* = null*/) { // gtkOthers = [ [ gtkWidget, width ] ]
		if (!this._notebook || !this._notebook.page) return [];
		let (x = this._notebook.width, widgets = []) {
			if (gtkOthers && gtkOthers.length) {
				for (let i = gtkOthers.length - 1; i >= 0; --i) {
					this._notebook.page.attach(gtkOthers[i][0],
											   x -= gtkOthers[i][1], this._notebook.row,
											   gtkOthers[i][1] || 1, 1);
					widgets.unshift(gtkOthers[i][0]);
					if (!gtkOthers[i][1]) {
						gtkOthers[i][0].sensitive = false;
						gtkOthers[i][0].hide();
					}
					else {
						gtkOthers[i][0].show();
						if (bindSensitive) {
							this._settings.bind(bindSensitive, gtkOthers[i][0], 'sensitive', Gio.SettingsBindFlags.DEFAULT);
						}
					}
				}
			}
			if (gtkLabel) {
				this._notebook.page.attach(gtkLabel,
									   this._notebook.shift, this._notebook.row,
									   x - this._notebook.shift, 1);
				widgets.unshift(gtkLabel);
				if (bindSensitive) {
					this._settings.bind(bindSensitive, gtkLabel, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
				}
				gtkLabel.show();
			}
			this._notebook.row++; // whether something was added or not
			return widgets;
		} // let (x, widgets)
	},

    addSeparator: function() {
		if (!this._notebook) return [];
		return this.addRow(null, [ [ new Gtk.Separator({ hexpand: true }), this._notebook.width - this._notebook.shift ] ]);
    },

    addLabel: function(label, bindSensitive/* = null*/) {
		return this.addRow(new Gtk.Label({ label: label, halign: Gtk.Align.START, hexpand: true }), [], bindSensitive);
    },

    addImages: function(label, images, bindSensitive/* = null*/) {
        let (rowLabel = new Gtk.Label({ label: label, halign: Gtk.Align.START, hexpand: true }),
             rowImages = []) {
            if (images) {
                images.forEach(function (image) {
                	rowImages.push([ new Gtk.Image.new_from_file(Me.path + '/images/' + image, { halign: Gtk.Align.END }), 1 ]);
                });
            }
    		return this.addRow(rowLabel, rowImages, bindSensitive);
        }
    },

    addCheckBox: function(label, settingsKey, bindSensitive/* = null*/) {
		let (rowLabel = new Gtk.Label({ label: label, halign: Gtk.Align.START, hexpand: true }),
             rowSwitch = new Gtk.Switch({ halign: Gtk.Align.END })) {
			this._settings.bind(settingsKey, rowSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
			return this.addRow(rowLabel, [ [ rowSwitch, 1 ] ], bindSensitive);
        } // let (rowLabel, rowSwitch)
    },

    addColorButton: function(label, settingsKey, titleColorChooser, bindSensitive/* = null*/, showEntry/* = false*/) {
		if (!this._notebook) return [];
		let (rowLabel = new Gtk.Label({ label: label, halign: Gtk.Align.START, hexpand: true }),
             rowColorButtonEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.START, hexpand: true, width_chars: 9 }),
             rowColorButton = new Gtk.ColorButton({ halign: Gtk.Align.END, use_alpha: false, title: titleColorChooser }),
		     settingsbind = new dbFinSettingsBindEntryColorButton()) {
			this._notebook.widget._settingsbinds.push(settingsbind);
			settingsbind.bind(settingsKey, rowColorButtonEntry, rowColorButton);
			return this.addRow(rowLabel, [ [ rowColorButtonEntry, !showEntry ? 0 : 2 ], [ rowColorButton, 1 ] ], bindSensitive);
        } // let (rowLabel, rowColorButtonEntry, rowColorButton, settingsbind)
    },

    addScale: function(label, settingsKey, min, max, step, bindSensitive/* = null*/, showEntry/* = false*/) {
		if (!this._notebook) return [];
		let (rowLabel = new Gtk.Label({ label: label, halign: Gtk.Align.START, hexpand: true }),
             rowScaleEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.START, hexpand: true, width_chars: 5 }),
             rowScale = new Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, min, max, step,
                                                 { halign: Gtk.Align.END, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
		     settingsbind = new dbFinSettingsBindEntryScale()) {
			this._notebook.widget._settingsbinds.push(settingsbind);
			settingsbind.bind(settingsKey, rowScaleEntry, rowScale);
			return this.addRow(rowLabel, [ [ rowScaleEntry, !showEntry ? 0 : 1 ], [ rowScale, !showEntry ? 3 : 2 ] ], bindSensitive);
        } // let (rowLabel, rowScaleEntry, rowScale, settingsbind)
    },

	addComboBoxText: function(label, settingsKey, arrayLabels, subIndex, bindSensitive/* = null*/, showEntry/* = false*/) {
		if (!this._notebook) return [];
		let (rowLabel = new Gtk.Label({ label: label, halign: Gtk.Align.START, hexpand: true }),
             rowComboBoxTextEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.START, hexpand: true, width_chars: 5 }),
             rowComboBoxText = new Gtk.ComboBoxText({ halign: Gtk.Align.END, hexpand: true }),
		     settingsbind = new dbFinSettingsBindEntryComboBoxText()) {
            if (arrayLabels && arrayLabels.length) {
                if (subIndex === undefined || subIndex === null) {
                    for (let i = 0; i < arrayLabels.length; ++i) {
                        if (arrayLabels[i]) {
                            rowComboBoxText.append_text('' + arrayLabels[i]);
                        }
                    }
                }
                else {
                    for (let i = 0; i < arrayLabels.length; ++i) {
                        if (arrayLabels[i] && arrayLabels[i].length) {
                            rowComboBoxText.append_text('' + arrayLabels[i][subIndex]);
                        }
                    }
                }
            }
			this._notebook.widget._settingsbinds.push(settingsbind);
			settingsbind.bind(settingsKey, rowComboBoxTextEntry, rowComboBoxText);
			return this.addRow(rowLabel, [ [ rowComboBoxTextEntry, !showEntry ? 0 : 1 ], [ rowComboBoxText, 4 ] ], bindSensitive);
        } // let (rowLabel, rowComboBoxTextEntry, rowComboBoxText, settingsbind)
    }
});
