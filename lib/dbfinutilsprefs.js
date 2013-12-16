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
 * dbfinutilsprefs.js
 * Common utilities for preferences.
 *
 *
 * CLASSES
 *
 *  dbFinSettingsResetExportImport  reset/export/import settings
 *
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
 * dbFinSettingsBindEntryFileChooserButton  this is a helper class to synchronize GSettings::string, gtkEntry and gtkFileChooserButton
 *		Methods:
 *			bind(settingsKey, gtkEntry, gtkFileChooserButton)
 *							binds GSettings string key, gtkEntry and gtkFileChooserButton
 *
 * dbFinSettingsWidgetBuilder	this is a helper class to build settings widget
 * 		Methods:
 *          getWidget()
 *          shift()
 *          unshift()
 *          setWidthRight()
 *			addNotebook(label?, iconfile?, bindSensitive?)
 *			closeNotebook()
 * 			addPage(label, iconfile?, bindSensitive?)
 * 			addWidget(gtkWidget, x, y, w, h, bindSensitive?)
 * 			addRow(gtkWidget?, [gtkOthers], bindSensitive?)
 *          addSeparator(bindSensitive?)
 *          addLabel(label, bindSensitive?, markup?, justify=0, rightmargin=0)
 *          addCheckBox(label, settingsKey, bindSensitive?)
 *          addColorButton(label, settingsKey, titleColorChooser, bindSensitive?, showEntry?)
 *          addScale(label, settingsKey, min, max, step, bindSensitive?, showEntry?)
 * 			addScaleScale(label, settingsKey1, settingsKey2, min1, max1, step1, min2, max2, step2, bindSensitive?, showEntry1?, showEntry2?)
 *          addCheckBoxScale(label, settingsKey1, settingsKey2, min, max, step, bindSensitive?, showEntry?, bindScale?)
 * 			addColorButtonScale(label, settingsKeyColor, settingsKeyScale, titleColorChooser, min, max, step, bindSensitive?, showEntryColor?, showEntryScale?)
 *          addComboBoxText(label, settingsKey, arrayLabels, subIndex, bindSensitive?, showEntry?)
 *          addFileChooserButton(label, settingsKey, titleFileChooser, filter, bindSensitive?)
 *
 *          addPageWelcome(name, title)
 *          addPageREI(name)
 *
 */

const Lang = imports.lang;

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
const dbFinConsts = Me.imports.dbfinconsts;
const dbFinSettings = Me.imports.dbfinsettings;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinTimeout = Me.imports.dbfintimeout;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

/* class dbFinSettingsResetExportImport: reset/export/import settings
 */
const dbFinSettingsResetExportImport = new Lang.Class({
	Name: 'dbFin.SettingsResetExportImport',

	_init: function(name, gtkButtonReset, gtkButtonExport, gtkButtonImport, gtkFileChooser, gtkLabelStatus) {
        this._signals = new dbFinSignals.dbFinSignals();
		this._settings = Convenience.getSettings();
        this._name = '' + name;
		if (gtkButtonReset) {
			this._gtkButtonReset = gtkButtonReset;
			this._signals.connectNoId({	emitter: gtkButtonReset, signal: 'clicked',
                                        callback: this.doReset, scope: this });
		}
		if (gtkButtonExport) {
			this._gtkButtonExport = gtkButtonExport;
			this._signals.connectNoId({	emitter: gtkButtonExport, signal: 'clicked',
										callback: this.doExport, scope: this });
		}
		if (gtkButtonImport) {
			this._gtkButtonImport = gtkButtonImport;
			this._signals.connectNoId({	emitter: gtkButtonImport, signal: 'clicked',
										callback: this.doImport, scope: this });
		}
		if (gtkFileChooser) {
			this._gtkFileChooser = gtkFileChooser;
		}
		if (gtkLabelStatus) {
			this._gtkLabelStatus = gtkLabelStatus;
			gtkLabelStatus.label = '';
		}
        this._timeout = new dbFinTimeout.dbFinTimeout();
	},

	destroy: function() {
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
        if (this._timeout) {
            this._timeout.destroy();
            this._timeout = null;
        }
        this._gtkButtonReset = null;
		this._gtkButtonExport = null;
		this._gtkButtonImport = null;
		this._gtkFileChooser = null;
		this._gtkLabelStatus = null;
        this._settings = null;
	},

    doReset: function() {
        try {
            let ([ ok, pid ] = GLib.spawn_async(
                    /*working_directory = */null,
                    /*argv = */[ 'dconf', 'reset', '-f', '/org/gnome/shell/extensions/dbfin/' + this._name + '/' ],
                    /*envp = */null,
                    /*GSpawnFlags = */GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                    /*GSpawnChildSetupFunc = */null
            )) {
                if (ok) this._updateStatus(_("Settings were reset successfully!"), '#dfa');
                else this._updateStatus('Something went wrong.', '#faa');
                if (pid) GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, function () {}, null);
            }
        }
        catch (e) {
            if (e.message) this._updateStatus(e.message, '#faa');
            else this._updateStatus('' + e, '#faa');
        }
    },

	doExport: function() {
		if (!this._gtkFileChooser || !this._settings) return;
		let (pf = this._gtkFileChooser.get_filename()) {
			try {
				if (!pf) throw _("Please specify settings directory and file name.");
				let (s = '', groups = {}, groupsArray = [], gf = null, gfos = null, gbos = null) {
					dbFinConsts.Settings.forEach(function (ss) {
						if (ss[3]) {
							if (groups[ss[3]] === undefined) {
								groups[ss[3]] = [];
								groupsArray.push(ss[3]);
							}
							groups[ss[3]].push(ss[0]);
						}
					});
					groupsArray.sort();
					groupsArray.forEach(Lang.bind(this, function (g) {
						if (s) s += '\n';
						s += '[' + g + ']\n';
						groups[g].forEach(Lang.bind(this, function (k) {
							if (this._settings.list_keys().indexOf(k) == -1) return;
							let (v = this._settings.get_value(k)) {
								let (t = v.get_type_string(), vs = '') {
									if (t == 's') vs = v.get_string()[0];
									else if (t == 'b') vs = (v.get_boolean() ? '+' : '-');
									if (vs) s += k + '\t' + t + '\t' + vs + '\n';
								} // let (t, vs)
							} // let (v)
						})); // groups[g].forEach(k)
					})); // groupsArray.forEach(g)
					if (!(gf = Gio.file_new_for_path(pf))) throw _("Cannot create Gio.File object for file") + ' ' + pf + '.';
					if (!(gfos = gf.replace(/* etag = */null,
											/* make_backup = */true,
											/* flags = */Gio.FileCreateFlags.NONE,
											/* cancellable = */null))) {
						// typically, this throws its own exception if something goes wrong, but just in case...
						throw _("Cannot create/replace file") + ' ' + pf + '.';
					}
					if (!(gbos = Gio.DataOutputStream.new(/* base_stream = */gfos))) throw _("Cannot create Gio.DataOutputStream object for file") + ' ' + pf + '.';
					if (!gbos.put_string(/* str = */s + '\n',
										 /* cancellable = */null)) throw _("Cannot write to file") + ' ' + pf + '.';
					if (gbos) {
						gbos.close(null);
					}
					this._updateStatus(_("File was created/updated successfully!"), '#dfa');
				} // let (s, groups, groupsArray, gf, gfos, gbos)
			} // try
			catch (e) {
				if (e.message) this._updateStatus(e.message, '#faa');
				else this._updateStatus('' + e, '#faa');
			} // try catch (e)
		} // let (pf)
	},

	doImport: function() {
		if (!this._gtkFileChooser || !this._settings) return;
		let (pf = this._gtkFileChooser.get_filename()) {
			try {
				if (!pf) throw _("Please specify settings directory and file name.");
				let (s = '', keys = this._settings.list_keys(), imported = 0, gf = null, gfis = null, gbis = null) {
					if (!(gf = Gio.file_new_for_path(pf))) throw _("Cannot create Gio.File object for file") + ' ' + pf + '.';
					if (!(gfis = gf.read(/* cancellable = */null))) throw _("Cannot open file") + ' ' + pf + '.';
					if (!(gbis = Gio.DataInputStream.new(/* base_stream = */gfis))) throw _("Cannot create Gio.DataInputStream object for file") + ' ' + pf + '.';
					while ((s = gbis.read_line(/* cancellable = */null)[0]) !== null) { // read line returns NULL at the end
						let (res = /(.*?)\t(.*?)\t(.*)/.exec(s)) {
							if (!res) continue;
							let (k = res[1], t = res[2], v = res[3]) {
								if (k && t && v && keys.indexOf(k) != -1) {
									++imported;
									if (t == 's') this._settings.set_string(k, v);
									else if (t == 'b') this._settings.set_boolean(k, v == '+');
									else --imported;
								}
							}
						}
					}
					if (gbis) {
						gbis.close(null);
					}
					this._updateStatus(_("File was read successfully") + ': ' + imported + ' ' + _("settings values imported."), '#dfa');
				} // let (s, keys, imported, gf, gfis, gbis)
			} // try
			catch (e) {
				if (e.message) this._updateStatus(e.message, '#faa');
				else this._updateStatus('' + e, '#faa');
			} // try catch (e)
		} // let (pf)
	},

	_updateStatus: function(msg, color) {
		if (!this._gtkLabelStatus) return;
		msg = msg || '';
		if (color) this._gtkLabelStatus.set_markup('<span background="' + color + '">   ' + msg + '   </span>');
		else this._gtkLabelStatus.set_markup('<span>   ' + msg + '   </span>');
		if ((msg || color) && this._timeout) this._timeout.add('status', 2222, this._updateStatus, this, true);
	}
});

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

/* class dbFinSettingsBindEntryFileChooserButton: this is a helper class to synchronize GSettings::string, gtkEntry and gtkFileChooserButton
 */
const dbFinSettingsBindEntryFileChooserButton = new Lang.Class({
	Name: 'dbFin.SettingsBindEntryFileChooserButton',
	Extends: dbFinSettingsBindEntry,

	_init: function() {
		this.parent();
	},

	destroy: function() {
		this.parent();
	},

	bind: function(settingsKey, gtkEntry, gtkFileChooserButton) {
		this.parent(settingsKey, gtkEntry, gtkFileChooserButton, 'file-set',
		            Lang.bind(this, this._updateEntry), Lang.bind(this, this._updateFileChooserButton));
	},

	_updateEntry: function() {
		if (this._gtkEntry && this._gtkWidget) {
			this._disconnectEntry();
            this._gtkEntry.set_text(this._gtkWidget.get_filename());
			this._connectEntry();
		} // if (this._gtkEntry && this._gtkWidget)
	},

	_updateFileChooserButton: function() {
		if (this._gtkEntry && this._gtkWidget) {
			this._disconnectWidget();
            let (filename = this._gtkEntry.get_text()) {
                try { this._gtkWidget.set_current_folder(filename.substring(0, filename.lastIndexOf('/'))); } catch (e) { }
                try { this._gtkWidget.select_filename(filename); } catch (e) { }
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

	// bindSensitive = either '[@][!]key' or array of '[@][!]key''s
    getBindBox: function(bindSensitive/* = null*/) {
		let (binds = bindSensitive && typeof bindSensitive == 'string' ? [ bindSensitive ] : bindSensitive || [],
             bind = '',
             bindBox = null,
             bindBoxTop = null,
             bindVisibility = false) {
			for (let j = 0; j < binds.length; ++j) {
                bind = binds[j];
				bindVisibility = bind && bind[0] == '@';
				if (bindVisibility) bind = bind.substring(1);
				let (bindInverse = bind && bind[0] == '!'	? Gio.SettingsBindFlags.INVERT_BOOLEAN
															: Gio.SettingsBindFlags.DEFAULT,
					 bindKey = bind && bind[0] == '!' ? bind.substring(1) : bind,
					 bindBoxNew = new Gtk.Box({	hexpand:	true,
												halign:		Gtk.Align.FILL,
												valign:		Gtk.Align.FILL })) {
					if (bindBox) bindBox.pack_end(bindBoxNew, /*expand =*/true, /*fill =*/true, /*padding =*/0);
                    else bindBoxTop = bindBoxNew;
					bindBoxNew.show();
					this._settings.bind(bindKey, bindBoxNew, bindVisibility ? 'visible' : 'sensitive', bindInverse);
					bindBox = bindBoxNew;
				} // let (bindInverse, bindKey, bindBoxNew)
			} // for (let j)
            return [ bindBoxTop, bindBox ];
        } // let (binds, bind, bindBox, bindBoxTop, bindVisibility)
    },

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
        if (label) this.addPage(label, iconfile, bindSensitive);
	},

	closeNotebook: function() {
		if (this._notebooks.length > 1) { // never close top notebook
			this._notebooks.pop();
			this._notebook = this._notebooks[this._notebooks.length - 1];
		}
	},

    addActions: function(packStart/* = false*/) {
		if (!this._notebook || !(this._notebooks.length & 1)) return null;
        let (page = new Gtk.Grid({	margin:				5,
									row_spacing:		5,
									column_spacing:		5,
									column_homogeneous: false })) {
			this._notebook.widget.set_action_widget(page, packStart ? Gtk.PackType.START : Gtk.PackType.END);
            this._notebook.page = page;
            this._notebook.row = 0;
			this._notebook.shift = 0;
            page.show();
            return page;
        }
    },

	// bindSensitive = '[!]key'
	addPage: function(label, iconfile/* = null*/, bindSensitive/* = null*/) {
		if (!this._notebook) return null;
        let (page = new Gtk.Grid({	hexpand:			true,
									halign:				Gtk.Align.FILL,
									valign:				Gtk.Align.FILL,
									margin:				7,
									row_spacing:		7,
									column_spacing:		7,
									column_homogeneous:	true }),
             pageLabel = new Gtk.Label(),
             pageLabelBox = (this._notebooksPagesCircle
                             ? (this._notebooks.length & 1 ? new Gtk.HBox() : new Gtk.VBox())
                             : (this._notebooks.length != 2 ? new Gtk.HBox() : new Gtk.VBox())),
             [ bindBoxTop, bindBox ] = this.getBindBox(bindSensitive)) {
            pageLabel.set_markup(label);
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
            this._notebook.page = page;
            this._notebook.row = 0;
			this._notebook.shift = 0;
            page.show();
            if (!bindBox) {
			    this._notebook.widget.append_page(/*child = */page, /*tab_label = */pageLabelBox);
            }
            else {
			    this._notebook.widget.append_page(/*child = */bindBoxTop, /*tab_label = */pageLabelBox);
                bindBox.pack_end(page, /*expand =*/true, /*fill =*/true, /*padding =*/0);
            }
            return page;
        }
    },

	// gtkWidget = Gtk.Widget or a string for Gtk.Label
	addWidget: function(gtkWidget, x, y, w, h, bindSensitive/* = null*/) {
		if (!gtkWidget || !this._notebook || !this._notebook.page) return [];
		if (!(gtkWidget instanceof Gtk.Widget)) {
			let (label = '' + gtkWidget) {
				gtkWidget = new Gtk.Label({ halign: Gtk.Align.START, valign: Gtk.Align.CENTER, hexpand: true });
				gtkWidget.set_markup(label);
			}
		}
		if (!w || w < 0 || !h || h < 0) {
			this._notebook.page.attach(gtkWidget, x, y, 1, 1);
			gtkWidget.sensitive = false;
			gtkWidget.hide();
		} // if (!w || w < 0 || !h || h < 0)
		else {
			let ([ bindBoxTop, bindBox ] = this.getBindBox(bindSensitive)) {
				gtkWidget.show();
				if (!bindBox) {
                    this._notebook.page.attach(gtkWidget, x, y, w, h);
                }
				else {
                    this._notebook.page.attach(bindBoxTop, x, y, w, h);
                    bindBox.pack_end(gtkWidget, /*expand =*/true, /*fill =*/true, /*padding =*/0);
                }
			} // let (bindBox)
		} // if (!w || w < 0 || !h || h < 0) else
		return [ gtkWidget ];
	},

	// gtkWidget = Gtk.Widget or a string for Gtk.Label
	// gtkOthers = [ [ gtkWidget, width, ?bindSensitive ] ]
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
		let (x = this._notebook.shift,
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
						let ([ bindBoxTop, bindBox ] = this.getBindBox(gtkOthers[i][2] === undefined
                                                                       ? bindSensitive
                                                                       : gtkOthers[i][2])) {
						    gtkOthers[i][0].show();
							if (!bindBox) {
                                this._notebook.page.attach(gtkOthers[i][0], x, this._notebook.row, gtkOthers[i][1], 1);
                            }
							else {
                                this._notebook.page.attach(bindBoxTop, x, this._notebook.row, gtkOthers[i][1], 1);
                                bindBox.pack_end(gtkOthers[i][0], /*expand =*/true, /*fill =*/true, /*padding =*/0);
                            }
						} // let (bindBox)
					} // if (!gtkOthers[i][1] || gtkOthers[i][1] < 0) else
				} // if (gtkOthers[i][0])
				x += gtkOthers[i][1];
			} // for (let i)
			this._notebook.row++; // whether something was added or not
			return widgets;
		} // let (x, widgets)
	},

    addSeparator: function(bindSensitive/* = null*/) {
		if (!this._notebook) return [];
		return this.addRow(new Gtk.Separator({ hexpand: true }), null, bindSensitive);
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
			return this.addRow(label, [ [ rowColorButtonEntry, !showEntry ? 0 : 1 ], [ null, !showEntry ? 0 : (this._notebook.widthRight - 2) ], [ rowColorButton, 1 ], [ null, !showEntry ? (this._notebook.widthRight - 1) : 0 ] ], bindSensitive);
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
        } // let (rowScaleEntry1, rowScale1, rowScaleEntry2, rowScale2, settingsbind1, settingsbind2)
    },

    addCheckBoxScale: function(label, settingsKey1, settingsKey2, min, max, step, bindSensitive/* = null*/, showEntry/* = false*/, bindScale/* = false*/) {
		if (!this._notebook) return [];
		let (rowSwitch = new Gtk.Switch({ halign: Gtk.Align.START, valign: Gtk.Align.CENTER }),
             rowScaleEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, width_chars: 5 }),
             rowScale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, min, max, step,
                                                 { halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, digits: 0, draw_value: false, has_origin: true }),
		     settingsbind = new dbFinSettingsBindEntryScale()) {
			this._settings.bind(settingsKey1, rowSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
			this._notebook.widget._settingsbinds.push(settingsbind);
			settingsbind.bind(settingsKey2, rowScaleEntry, rowScale);
			return this.addRow(label, [
                   [ rowSwitch, 1 ],
                   [ rowScaleEntry, !showEntry ? 0 : 1, bindScale ? [ settingsKey1 ].concat(bindSensitive) : undefined ],
                   [ rowScale, this._notebook.widthRight - 1 - (!showEntry ? 0 : 1), bindScale ? [ settingsKey1 ].concat(bindSensitive) : undefined ]
            ], bindSensitive);
        } // let (rowSwitch, rowScaleEntry, rowScale, settingsbind)
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
    },

    addFileChooserButton: function(label, settingsKey, titleFileChooser, filter, bindSensitive/* = null*/) {
		if (!this._notebook) return [];
		let (rowFileChooserEntry = new Gtk.Entry({ text: '', halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, width_chars: 8 * (this._notebook.widthRight - 2) }),
             rowFileChooserButton = new Gtk.FileChooserButton({ halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true, title: titleFileChooser, action: Gtk.FileChooserAction.OPEN, width_chars: 12 }),
             gtkFilter = new Gtk.FileFilter(),
		     settingsbind = new dbFinSettingsBindEntryFileChooserButton()) {
			this._notebook.widget._settingsbinds.push(settingsbind);
            rowFileChooserButton.set_show_hidden(false);
            gtkFilter.add_pattern(filter);
            rowFileChooserButton.set_filter(gtkFilter);
			settingsbind.bind(settingsKey, rowFileChooserEntry, rowFileChooserButton);
			return this.addRow(label, [ [ rowFileChooserEntry, this._notebook.widthRight - 2 ], [ rowFileChooserButton, 2 ] ], bindSensitive);
        } // let (rowFileChooserEntry, rowFileChooserButton, settingsbind)
    },

    addPageWelcome: function(name, title) {
        if (!name || !title || !this._notebook) return null;
        let (page = null, widgets = null) {
            page = this.addPage(_("Welcome"));
                widgets = this.addWidget(Gtk.Image.new_from_file(Me.path + '/images/' + name + '.png'), 0, 0, 3, 7);
                if (widgets && widgets.length) {
                    widgets[0].hexpand = true;
                    widgets[0].vexpand = true;
                    widgets[0].xalign = 0.5;
                    widgets[0].yalign = 0.5;
                }
                widgets = this.addWidget(Gtk.Image.new_from_file(Me.path + '/images/gplv3.png'), 9, 11, 1, 2);
                if (widgets && widgets.length) {
                    widgets[0].hexpand = true;
                    widgets[0].vexpand = true;
                    widgets[0].xalign = 1.0;
                    widgets[0].yalign = 0.5;
                }

                widgets = this.addRow(null, [ [ new Gtk.Label({ halign: Gtk.Align.START }), 6 ], [ new Gtk.Label({ halign: Gtk.Align.END }), 1 ] ]);
                if (widgets && widgets.length) {
                    widgets[0].set_markup('<span size="x-large">' + title + '</span>');
                    widgets[1].set_markup('v' + Me.metadata.version);
                }
                widgets = this.addRow(null, [ [ new Gtk.Label({ halign: Gtk.Align.START }), 7 ] ]);
                if (widgets && widgets.length) {
                    widgets[0].set_markup('<span size="large">' + _("GNOME Shell Extension") + '</span>');
                }
                this.addRow(null, [ [ new Gtk.Separator({ hexpand: true }), 7 ] ]);
                widgets = this.addRow(null, [ [ new Gtk.Label({ halign: Gtk.Align.START }), 7 ] ]);
                if (widgets && widgets.length) {
                    widgets[0].set_markup(_("Copyright") + ' &#169; 2013 Vadim Cherepanov @ dbFin <a href="mailto:vadim@dbfin.com"><span color="#000000" underline="none">&lt;vadim@dbfin.com&gt;</span></a>');
                }
                this.addRow(null, [ [ new Gtk.Separator({ hexpand: true }), 7 ] ]);
                widgets = this.addRow(null, [ [ new Gtk.Label({ halign: Gtk.Align.START }), 2 ], [ new Gtk.Label({ halign: Gtk.Align.START }), 5 ] ]);
                if (widgets && widgets.length) {
                    widgets[0].set_markup(_("Home page") + ':');
                    widgets[1].set_markup('<a href="http://dbfin.com"><span color="#347" underline="none">http://dbfin.com</span></a>');
                }
                widgets = this.addRow(null, [ [ new Gtk.Label({ halign: Gtk.Align.START }), 2 ], [ new Gtk.Label({ halign: Gtk.Align.START }), 5 ] ]);
                if (widgets && widgets.length) {
                    widgets[0].set_markup(_("Source code") + ':');
                    widgets[1].set_markup('<a href="https://github.com/dbfin/gnome-shell-extension-yawl/tree/' + (name === 'yawl' ? 'master' : name) + '"><span color="#347" underline="none">https://github.com/dbfin/gnome-shell-extension-yawl/tree/' + (name === 'yawl' ? 'master' : name) + '</span></a>');
                }

                this.addLabel('<span size="small"> </span>', null, true);
                let (s = '') {
                    if (dbFinConsts.arrayContributors && dbFinConsts.arrayContributors.length) {
                        for (let i = 0; i < dbFinConsts.arrayContributors.length; ++i) {
                            s += (i ? ', ' : ' ') + dbFinConsts.arrayContributors[i][0]
                                    + ' (' + _(dbFinConsts.arrayContributors[i][1]) + ')';
                        }
                    }
                    if (s != '') this.addLabel(_("Special thanks to") + ':' + s, null, true, 3);
                    else this.addLabel('<span size="small"> </span>', null, true);
                }
                this.addLabel('<span size="small">' + _("If you would like to translate the program to your language feel free to do so: please use GitHub or email me for instructions.") + '</span>', null, true);
                this.addSeparator();
                this.addLabel('<span size="small">' + _("This is free software -- free as in beer and free as in freeman -- distributed under the terms of the GNU General Public License (GPL) version 3.") + '</span>', null, true, 3, 1);
                this.addLabel('<span size="small">' + _("A copy of the License is distributed along with the software (file GNUGPLv3) and is also available at <a href='http://www.gnu.org/licenses/'><span color='#000000' underline='none'>http://www.gnu.org/licenses/gpl.html</span></a>.") + '</span>', null, true, 3, 1);
                this.addLabel('<span size="small">' + _("You are free to use, modify or otherwise distribute the code of this software provided that your actions comply with all applicable laws and GPL.") + '</span>'
                                  + ' ' + '<span size="small">' + _("In particular, you must include the above copyright notice and a copy of the License in all copies or substantial portions of the software, whether original or modified.") + '</span>', null, true, 3);
                this.addLabel('<span size="small">' + _("This software is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY: without even implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.") + '</span>'
                                  + ' ' + '<span size="small">' + _("For more details please see the GNU General Public License (GPL) version 3.") + '</span>', null, true, 3);
            return page;
        } // let (page, widgets)
    },

    addPageREI: function(name) {
        if (!name || !this._notebook) return null;
        let (page = null, widgets = null, notebook = {}) {
            page = this.addPage(_("Export/Import"));

            for (let p in this._notebook) if (this._notebook.hasOwnProperty(p)) notebook[p] = this._notebook[p];

            let notebookConnectId = notebook.widget.connect('switch-page', Lang.bind(this, function (notebookWidget_, page_, pageNumber_) {
                if (page_ !== page || notebook._fcw) return;
                notebook.widget.disconnect(notebookConnectId);
                let notebookWas = this._notebook;
                this._notebook = notebook;
                widgets = this.addRow(null, [
                    [ new Gtk.Label({ label: _("Back up, sync and share settings."), halign: Gtk.Align.START, valign: Gtk.Align.START }), 4 ],
                    [ null, 1 ],
                    [ new Gtk.Label({ halign: Gtk.Align.END, valign: Gtk.Align.START }), 5 ]
                ], '@!advanced');
                if (widgets && widgets.length) {
                    widgets[0].set_line_wrap(true);
                    widgets[1].set_line_wrap(true);
                    widgets[1].set_markup(_("To reset all settings please enable") + ' ' + _("Advanced settings") + ' <span color="red">*</span>');
                }
                widgets = this.addRow(null, [
                    [ new Gtk.Label({ label: _("Back up, sync and share settings."), halign: Gtk.Align.START, valign: Gtk.Align.START }), 4 ],
                    [ null, 1 ],
                    [ new Gtk.Label({ halign: Gtk.Align.END, valign: Gtk.Align.START }), 2 ],
                    [ new Gtk.Button({ label: '\u26a0 ' + _("Reset settings"), halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER, hexpand: true }), 3 ]
                ], '@advanced');
                if (widgets && widgets.length) {
                    widgets[0].set_line_wrap(true);
                    widgets[1].set_line_wrap(true);
                    widgets[1].set_markup('<span size="small">' + '\u26a0 ' + _("This will overwrite all current settings") + '</span>' + ' <span color="red">*</span>');
                    this._notebook._bsr = widgets[2];
                }
                widgets = this.addRow(new Gtk.FileChooserWidget({	action: Gtk.FileChooserAction.SAVE, create_folders: true,
                                                                        do_overwrite_confirmation: false, select_multiple: false,
                                                                        show_hidden: false, hexpand: true, vexpand: true,
                                                                        halign: Gtk.Align.FILL, valign: Gtk.Align.FILL }));
                if (widgets && widgets.length) {
                    widgets[0].set_current_folder('~');
                    widgets[0].set_show_hidden(true);
                    widgets[0].set_current_name('all.' + name + '.settings');
                    this._notebook._fcw = widgets[0];
                }
                widgets = this.addRow(_("Status:"), [ [ new Gtk.Label({ label: '', halign: Gtk.Align.FILL }), 9 ] ]);
                if (widgets && widgets.length) {
                    this._notebook._ls = widgets[1];
                }
                widgets = this.addRow(null, [
                                        [ new Gtk.Label({ justify: 1, halign: Gtk.Align.END, hexpand: true }), 2 ],
                                        [ new Gtk.Button({ label: _("Export"), halign: Gtk.Align.FILL, hexpand: true }), 2 ],
                                        [ null, 1 ],
                                        [ new Gtk.Label({ justify: 1, halign: Gtk.Align.END, hexpand: true }), 2 ],
                                        [ new Gtk.Button({ label: _("Import"), halign: Gtk.Align.FILL, hexpand: true }), 2 ]
                                     ]);
                if (widgets && widgets.length) {
                    widgets[0].set_line_wrap(true);
                    widgets[0].set_markup('<span size="small">' + '\u26a0 ' + _("This will overwrite the file with settings") + '</span>');
                    this._notebook._bse = widgets[1];
                    widgets[2].set_line_wrap(true);
                    widgets[2].set_markup('<span size="small">' + '\u26a0 ' + _("This will overwrite all current settings") + '</span>');
                    this._notebook._bsi = widgets[3];
                }
                this._notebook._sei = new dbFinSettingsResetExportImport(
                        name,
                        this._notebook._bsr,
                        this._notebook._bse,
                        this._notebook._bsi,
                        this._notebook._fcw,
                        this._notebook._ls
                );
                this._notebook = notebookWas;
            })); // page.connect
            return page;
        } // let (page, widgets, notebook)
    }
});
