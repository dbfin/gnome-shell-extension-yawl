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

const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;
const dbFinClickMeter = Me.imports.dbfinclickmeter;
const dbFinConsts = Me.imports.dbfinconsts;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinUtils = Me.imports.dbfinutils;
const dbFinUtilsPrefs = Me.imports.dbfinutilsprefs;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

function init() {
    Convenience.initTranslations();
}

// TODO: something more "sophisticated"?
const dbFinClicksThreshold = new Lang.Class({
    Name: 'dbFin.ClicksThreshold',

    _init: function() {
        this._signals = new dbFinSignals.dbFinSignals();
		this._settings = Convenience.getSettings();

        this._scaleSingle = null;
        this._scaleDouble = null;
        this._scaleThreshold = null;

		this._timeSingle = [];
		let (time = dbFinUtils.settingsParseInt(this._settings, 'mouse-clicks-time-single', 250, 750, 400)) {
			for (let i = 0; i < 7; ++i) this._timeSingle[i] = time;
			this._timeSingleSum = time * this._timeSingle.length;
		}
		this._timeDouble = [];
		let (time = dbFinUtils.settingsParseInt(this._settings, 'mouse-clicks-time-double', 100, 450, 250)) {
			for (let i = 0; i < 7; ++i) this._timeDouble[i] = time;
			this._timeDoubleSum = time * this._timeDouble.length;
		}

        this._signals.connectNoId({ emitter: this._settings, signal: 'changed::mouse-clicks-time-single',
                                    callback: this._updateThreshold, scope: this });
        this._signals.connectNoId({ emitter: this._settings, signal: 'changed::mouse-clicks-time-double',
                                    callback: this._updateThreshold, scope: this });
    },

    destroy: function() {
        if (this._signals) {
            this._signals.destroy();
            this._signals = null;
        }
        this._settings = null;
    },

	set scaleSingle(scale) {
		this._scaleSingle = scale;
		this._signals.disconnectId('scale-single-value-changed');
		if (this._scaleSingle) {
			this._signals.connectId('scale-single-value-changed', {	emitter: this._scaleSingle, signal: 'value-changed',
                                                                    callback: this._updateThreshold, scope: this });
		}
	},

	set scaleDouble(scale) {
		this._scaleDouble = scale;
		this._signals.disconnectId('scale-double-value-changed');
		if (this._scaleDouble) {
			this._signals.connectId('scale-double-value-changed', {	emitter: this._scaleDouble, signal: 'value-changed',
                                                                    callback: this._updateThreshold, scope: this });
		}
	},

	set scaleThreshold(scale) {
		this._scaleThreshold = scale;
	},

	_updateThreshold: function() {
		if (!this || !this._scaleSingle || !this._scaleDouble || !this._scaleThreshold) return;
		let (s = this._scaleSingle.get_value(), d = this._scaleDouble.get_value()) {
			if (s && d) {
				let (v = Math.floor(Math.max(d * 8 / 7, s * 1 / 3 + d * 2 / 3))) {
					if (v !== this._scaleThreshold.get_value()) try { this._scaleThreshold.set_value(v); } catch(e) {}
				}
			}
		}
	},

    clickSingle: function(time) {
		if (this._timeSingle && this._timeSingle.length) {
			this._timeSingleSum -= this._timeSingle.pop() - time;
			this._timeSingle.unshift(time);
			let (v = Math.floor(this._timeSingleSum / this._timeSingle.length)) {
				if (this._scaleSingle && v !== this._scaleSingle.get_value()) this._scaleSingle.set_value(v);
			}
		}
    },

    clickDouble: function(time) {
		if (this._timeDouble && this._timeDouble.length) {
			this._timeDoubleSum -= this._timeDouble.pop() - time;
			this._timeDouble.unshift(time);
			let (v = Math.floor(this._timeDoubleSum / this._timeDouble.length)) {
				if (this._scaleDouble && v !== this._scaleDouble.get_value()) this._scaleDouble.set_value(v);
			}
		}
    }
});

function buildPrefsWidget() {
    let (builder = new dbFinUtilsPrefs.dbFinSettingsWidgetBuilder(), widgets) {

        builder.addNotebook(_("Interface"));
            builder.addNotebook(_("Panel"), 'panel.png');
                builder.addScale(_("YAWL-panel position"), 'yawl-panel-position', 10, 40, 1);
                builder.addCheckBox(_("Move central panel"), 'move-center');
                builder.addCheckBox(_("Hide Activities button"), 'hide-activities');
                builder.shift();
                    builder.addCheckBox(_("Preserve Hot Corner"), 'preserve-hot-corner', 'hide-activities');
                builder.unshift();
                builder.addCheckBox(_("Hide AppMenu button"), 'hide-app-menu');
                builder.addSeparator();
                builder.addCheckBox(_("Custom panel background"), 'panel-background');
                builder.shift();
                    builder.addColorButton(_("Panel color"), 'panel-color', _("Choose Panel Color"), 'panel-background', true);
                    builder.addScale(_("Panel opacity"), 'panel-opacity', 0, 100, 1, 'panel-background');
                builder.unshift();

            builder.addPage(_("Icons"), 'icon.png');
                builder.addScale(_("Icon size"), 'icons-size', 16, 96, 8);
                builder.addCheckBox(_("Faded icons"), 'icons-faded');
				builder.addScale(_("Default icon opacity"), 'icons-opacity', 50, 100, 1);
                builder.addSeparator();
                builder.addScale(_("Distance between icons (% of icon size)"), 'icons-distance', 0, 100, 1);
                builder.addScale(_("Clip icons: top (px)"), 'icons-clip-top', 0, 7, 1);
                builder.addScale(_("Clip icons: bottom (px)"), 'icons-clip-bottom', 0, 7, 1);

            builder.addPage(_("Animation"), 'animation.png');
                builder.addScale(_("Animation Time in ms (0: no animation)"), 'icons-animation-time', 0, 1000, 1, null, true);
                builder.addSeparator();
				builder.addCheckBox(_("Animate on hover"), 'icons-hover-animation');
				builder.shift();
					builder.addScale(_("Icon hover size (%)"), 'icons-hover-size', 100, 200, 1, 'icons-hover-animation');
					builder.addScale(_("Icon hover opacity"), 'icons-hover-opacity', 50, 100, 1, 'icons-hover-animation');
					builder.addCheckBox(_("Show full width on hover"), 'icons-hover-fit', 'icons-hover-animation');
				builder.unshift();

            builder.closeNotebook();

        builder.addPage(_("Behavior"));
            builder.addNotebook(_("Mouse"), 'mouse.png');
                builder.addNotebook(_("Left button"), 'mouse-left.png');
                    builder.addComboBoxText(_("Click : Double click"), 'mouse-app-left', dbFinConsts.arrayAppClickFunctions, 0, null);
                    builder.addComboBoxText(_("Ctrl + Click : Double click"), 'mouse-app-left-ctrl', dbFinConsts.arrayAppClickFunctions, 0, null);
                    builder.addComboBoxText(_("Shift + Click : Double click"), 'mouse-app-left-shift', dbFinConsts.arrayAppClickFunctions, 0, null);
                    builder.addComboBoxText(_("Ctrl + Shift + Click : Double click"), 'mouse-app-left-ctrl-shift', dbFinConsts.arrayAppClickFunctions, 0, null);

                builder.addPage(_("Middle button"), 'mouse-middle.png');
                    builder.addComboBoxText(_("Click : Double click"), 'mouse-app-middle', dbFinConsts.arrayAppClickFunctions, 0, null);
                    builder.addComboBoxText(_("Ctrl + Click : Double click"), 'mouse-app-middle-ctrl', dbFinConsts.arrayAppClickFunctions, 0, null);
                    builder.addComboBoxText(_("Shift + Click : Double click"), 'mouse-app-middle-shift', dbFinConsts.arrayAppClickFunctions, 0, null);
                    builder.addComboBoxText(_("Ctrl + Shift + Click : Double click"), 'mouse-app-middle-ctrl-shift', dbFinConsts.arrayAppClickFunctions, 0, null);
	                builder.addSeparator();
                    builder.addComboBoxText(_("Scroll up : down"), 'mouse-app-scroll', dbFinConsts.arrayAppClickFunctions, 0, null);

                builder.addPage(_("Fine-tuning"), 'tuning.png');
	                builder.addCheckBox(_("Mouse events on button release (default for Gnome-Shell is off)"), 'mouse-click-release');
	                builder.addSeparator();
                    let threshold = new dbFinClicksThreshold();
                    builder.getWidget()._threshold = threshold;
					builder.addRow(new Gtk.Label({ label: _("Make a fast series of SINGLE clicks"), halign: Gtk.Align.START, hexpand: true }),
                                   [	[ new Gtk.Image.new_from_file(Me.path + '/images/mouse-clicks-single.gif'), 1 ],
                                    	[ new Gtk.Label({ label: _("here:"), halign: Gtk.Align.END, hexpand: false }), 1 ],
                                    	[ (new dbFinClickMeter.dbFinClickMeter(250, 625, threshold.clickSingle, threshold)).widget, 1 ]
                                    ]);
					builder.shift();
	                    widgets = builder.addScale(_("Consequent single clicks time:"), 'mouse-clicks-time-single', 250, 750, 1, null, true);
	                    if (widgets && widgets.length) threshold.scaleSingle = widgets[widgets.length - 1];
					builder.unshift();
					builder.addRow(new Gtk.Label({ label: _("Make a series of DOUBLE clicks:"), halign: Gtk.Align.START, hexpand: true }),
                                   [	[ new Gtk.Image.new_from_file(Me.path + '/images/mouse-clicks-double.gif'), 1 ],
                                    	[ new Gtk.Label({ label: _("here:"), halign: Gtk.Align.END, hexpand: false }), 1 ],
                                    	[ (new dbFinClickMeter.dbFinClickMeter(100, 400, threshold.clickDouble, threshold)).widget, 1 ]
                                    ]);
					builder.shift();
	                    widgets = builder.addScale(_("Double clicks time:"), 'mouse-clicks-time-double', 100, 450, 1, null, true);
	                    if (widgets && widgets.length) threshold.scaleDouble = widgets[widgets.length - 1];
					builder.unshift();
                    widgets = builder.addScale(_("Single/Double clicks threshold:"), 'mouse-clicks-time-threshold', 150, 550, 1);
                    if (widgets && widgets.length) threshold.scaleThreshold = widgets[widgets.length - 1];

                builder.closeNotebook();

            builder.closeNotebook();

        return builder.getWidget();
    } // let (builder, widgets)
}
