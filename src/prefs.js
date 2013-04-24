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
const dbFinSettings = Me.imports.dbfinsettings;
const dbFinSignals = Me.imports.dbfinsignals;
const dbFinUtilsPrefs = Me.imports.dbfinutilsprefs;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

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
		let (time = dbFinSettings.dbFinSettings.prototype.parseInt('mouse-clicks-time-single', 400, { min: 250, max: 750 }, this._settings)) {
			for (let i = 0; i < 14; ++i) this._timeSingle[i] = time;
		}
		this._timeDouble = [];
		let (time = dbFinSettings.dbFinSettings.prototype.parseInt('mouse-clicks-time-double', 250, { min: 100, max: 450 }, this._settings)) {
			for (let i = 0; i < 14; ++i) this._timeDouble[i] = time;
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
		if (this._timeSingle && this._timeSingle.length > 1) {
			this._timeSingle.pop();
			this._timeSingle.unshift(time);
			// not efficient, but might be for small arrays
			let (	heap = this._timeSingle.slice().sort(function(a, b) { return a - b; }).slice(0, this._timeSingle.length >> 1),
			     	sum = 0) {
				heap.forEach(function (t) { sum += t; });
				let (v = Math.floor(sum / heap.length)) {
					if (this._scaleSingle && v !== this._scaleSingle.get_value()) this._scaleSingle.set_value(v);
				}
			}
		}
    },

    clickDouble: function(time) {
		if (this._timeDouble && this._timeDouble.length > 1) {
			this._timeDouble.pop();
			this._timeDouble.unshift(time);
			// not efficient, but might be for small arrays
			let (	heap = this._timeDouble.slice().sort(function(a, b) { return b - a; }).slice(0, this._timeDouble.length >> 1),
			     	sum = 0) {
				heap.forEach(function (t) { sum += t; });
				let (v = Math.floor(sum / heap.length)) {
					if (this._scaleDouble && v !== this._scaleDouble.get_value()) this._scaleDouble.set_value(v);
				}
			}
		}
    }
});

function buildPrefsWidget() {
    _D('@'); // supress all debugging
    let (builder = new dbFinUtilsPrefs.dbFinSettingsWidgetBuilder(), widgets) {

        builder.addNotebook(_("Icons"));
            builder.addNotebook(_("Panel"), 'panel.png');
                builder.addScaleScale(_("YAWL-panel position and width"), 'yawl-panel-position', 'yawl-panel-width', 0, 50, 1, 1, 100, 1);
                builder.addSeparator();
                builder.addCheckBox(_("Move central panel"), 'move-center');
                builder.addCheckBox(_("Hide Activities button"), 'hide-activities');
                builder.shift();
                    builder.addCheckBox(_("Preserve Hot Corner"), 'preserve-hot-corner', 'hide-activities');
                builder.unshift();
                builder.addCheckBox(_("Hide AppMenu button"), 'hide-app-menu');
                builder.addSeparator();
                builder.addCheckBox(_("Custom panel background"), 'panel-background');
                builder.shift();
                    builder.addColorButtonScale(_("Top color and opacity"), 'panel-top-color', 'panel-top-opacity', _("Choose panel background color"), 0, 100, 1, 'panel-background');
                    builder.addColorButtonScale(_("Bottom color and opacity"), 'panel-color', 'panel-opacity', _("Choose panel background color"), 0, 100, 1, 'panel-background');
                builder.unshift();

            builder.addPage(_("Icons"), 'icon.png');
                builder.addScale(_("Icon size"), 'icons-size', 16, 96, 8);
                builder.addCheckBox(_("Faded icons"), 'icons-faded');
				builder.addScale(_("Default icon opacity"), 'icons-opacity', 50, 100, 1);
                builder.addSeparator();
                builder.addScale(_("Clip icons: top (px)"), 'icons-clip-top', 0, 7, 1);
                builder.addScale(_("Clip icons: bottom (px)"), 'icons-clip-bottom', 0, 7, 1);
                builder.addSeparator();
                builder.addScale(_("Align icons on the panel (%)"), 'icons-align', 0, 100, 1);
                builder.addScale(_("Distance between icons\n(% of icon size)"), 'icons-distance', 0, 100, 1);

            builder.addPage(_("Animation"), 'animation.png');
                builder.addScale(_("Animation time in ms (0: no animation)"), 'icons-animation-time', 0, 1000, 1, null, true);
                builder.addComboBoxText(_("Animation effect"), 'icons-animation-effect', dbFinConsts.arrayAnimationTransitions, 0);
                builder.addSeparator();
				builder.addCheckBox(_("Animate icons on mouse over"), 'icons-hover-animation');
				builder.shift();
					builder.addScale(_("Change size (%)"), 'icons-hover-size', 100, 200, 1, 'icons-hover-animation');
					builder.addScale(_("Change opacity"), 'icons-hover-opacity', 50, 100, 1, 'icons-hover-animation');
					builder.addCheckBox(_("Show full width if partially hidden"), 'icons-hover-fit', 'icons-hover-animation');
	                builder.addSeparator();
	                builder.addScale(_("Mouse over animation time\n(% of animation time)"), 'icons-hover-animation-time', 0, 200, 1, 'icons-hover-animation');
                    builder.addComboBoxText(_("Mouse over animation effect"), 'icons-hover-animation-effect', dbFinConsts.arrayAnimationTransitions, 0, 'icons-hover-animation');
				builder.unshift();

            builder.closeNotebook();

		builder.addPage(_("Thumbnails"));
			builder.addNotebook(_("Panel"), 'panel_thumbnail.png');
                builder.addCheckBox(_("Use arrow-style thumbnails app indicator"), 'windows-indicator-arrow');
                builder.addCheckBox(_("Customize thumbnail panel theme"), 'windows-theming');
                builder.shift();
                    builder.addCheckBox(_("Match main panel background"), 'windows-background-panel', 'windows-theming');
					builder.addColorButtonScale(_("Background color and opacity"), 'windows-background-color', 'windows-background-opacity', _("Choose thumbnail panel background color"), 0, 100, 1, [ 'windows-theming', '!windows-background-panel' ]);
					builder.addColorButtonScale(_("Text color and size"), 'windows-text-color', 'windows-text-size', _("Choose thumbnail panel text color"), 6, 36, 1, 'windows-theming');
                    builder.addScale(_("Padding"), 'windows-padding', 0, 20, 1, 'windows-theming');
                    builder.addColorButtonScale(_("Border color and width"), 'windows-border-color', 'windows-border-width', _("Choose thumbnail panel border color"), 0, 3, 1, 'windows-theming');
                    builder.addScale(_("Border radius"), 'windows-border-radius', 0, 10, 1, 'windows-theming');
                builder.unshift();

			builder.addPage(_("Thumbnails"), 'thumbnail.png');
                builder.addCheckBox(_("Same height thumbnails"), 'windows-thumbnails-fit-height');
                builder.addScale(_("Thumbnail maximum width"), 'windows-thumbnails-width', 50, 500, 25, '!windows-thumbnails-fit-height', true);
				builder.addScale(_("Thumbnail maximum height"), 'windows-thumbnails-height', 40, 400, 20, null, true);
                builder.addScale(_("Thumbnail maximum visible height"), 'windows-thumbnails-height-visible', 40, 400, 20, null, true);
                builder.addSeparator();
				builder.addScale(_("Default thumbnail opacity"), 'windows-thumbnails-opacity', 50, 100, 1);
				builder.addScale(_("Minimized thumbnail opacity"), 'windows-thumbnails-minimized-opacity', 10, 100, 1);
                builder.addSeparator();
                builder.addScale(_("Distance between thumbnails\n(% of thumbnail size)"), 'windows-thumbnails-distance', 0, 50, 1);
                builder.addScale(_("Thumbnail top padding (px)"), 'windows-thumbnails-padding-top', 0, 20, 1);

			builder.addPage(_("Animation"), 'animation_thumbnail.png');
                builder.addScale(_("Thumbnails show delay in ms"), 'windows-show-delay', 0, 1000, 1, null, true);
                builder.addScale(_("Animation time in ms (0: no animation)"), 'windows-animation-time', 0, 1000, 1, null, true);
                builder.addComboBoxText(_("Animation effect"), 'windows-animation-effect', dbFinConsts.arrayAnimationTransitions, 0);
                builder.addSeparator();
				builder.addLabel(_("Animate thumbnails on mouse over"));
                builder.shift();
					builder.addScale(_("Change opacity"), 'windows-hover-opacity', 50, 100, 1);
					builder.addCheckBox(_("Show full width if partially hidden"), 'windows-hover-fit');
	                builder.addSeparator();
	                builder.addScale(_("Mouse over animation time\n(% of animation time)"), 'windows-hover-animation-time', 0, 200, 1);
                    builder.addComboBoxText(_("Mouse over animation effect"), 'windows-hover-animation-effect', dbFinConsts.arrayAnimationTransitions, 0);
                builder.unshift();

            builder.closeNotebook();

        builder.addPage(_("Behavior"));
            builder.addNotebook(_("Mouse"), 'mouse.png');
                builder.addNotebook(_("Left button"), 'mouse-left.png');
                    builder.addComboBoxText(_("Click : Double click"), 'mouse-app-left', dbFinConsts.arrayAppClickFunctions, 0);
                    builder.addComboBoxText(_("Ctrl + Click : Double click"), 'mouse-app-left-ctrl', dbFinConsts.arrayAppClickFunctions, 0);
                    builder.addComboBoxText(_("Shift + Click : Double click"), 'mouse-app-left-shift', dbFinConsts.arrayAppClickFunctions, 0);
                    builder.addComboBoxText(_("Ctrl + Shift + Click : Double click"), 'mouse-app-left-ctrl-shift', dbFinConsts.arrayAppClickFunctions, 0);
	                builder.addSeparator();
					builder.addLabel(_("Long left button click emulates right click (useful for touch screens)"));
                    builder.shift();
						builder.addLabel(_("\u26a0 This will work only if option 'Fine-tuning \u2192 Mouse events on button release' is enabled"));
    	                builder.addCheckBox(_("Long left button click = right button click"), 'mouse-long-click', 'mouse-click-release');
                    builder.unshift();

                builder.addPage(_("Middle button"), 'mouse-middle.png');
                    builder.addComboBoxText(_("Click : Double click"), 'mouse-app-middle', dbFinConsts.arrayAppClickFunctions, 0);
                    builder.addComboBoxText(_("Ctrl + Click : Double click"), 'mouse-app-middle-ctrl', dbFinConsts.arrayAppClickFunctions, 0);
                    builder.addComboBoxText(_("Shift + Click : Double click"), 'mouse-app-middle-shift', dbFinConsts.arrayAppClickFunctions, 0);
                    builder.addComboBoxText(_("Ctrl + Shift + Click : Double click"), 'mouse-app-middle-ctrl-shift', dbFinConsts.arrayAppClickFunctions, 0);
	                builder.addSeparator();
                    builder.addComboBoxText(_("Scroll up : down"), 'mouse-app-scroll', dbFinConsts.arrayAppClickFunctions, 0);

                builder.addPage(_("Fine-tuning"), 'tuning.png');
	                builder.addCheckBox(_("Mouse events on button release\n(default for Gnome-Shell is off)"), 'mouse-click-release');
	                builder.addSeparator();
                    let threshold = new dbFinClicksThreshold();
                    builder.getWidget()._threshold = threshold;
					builder.addLabel(_("This will measure the SHORTEST time between two consecutive SINGLE clicks."));
					builder.shift();
						widgets = builder.addRow(_("Make a fast series of SINGLE clicks"),
									   [	[ new Gtk.Image.new_from_file(Me.path + '/images/mouse-clicks-single.gif'), 1 ],
											[ new Gtk.Label({ label: _("here") + '  \u2192 ', halign: Gtk.Align.END, hexpand: false }), 1 ],
											[ (new dbFinClickMeter.dbFinClickMeter(250, 625, threshold.clickSingle, threshold)).widget, 2 ]
										]);
	                    if (widgets && widgets.length) { widgets[1].hexpand = true; widgets[1].xalign = 0.0; }
	                    widgets = builder.addScale(_("Consequent single clicks time:"), 'mouse-clicks-time-single', 250, 750, 1, null, true);
	                    if (widgets && widgets.length) threshold.scaleSingle = widgets[widgets.length - 1];
					builder.unshift();
					builder.addLabel(_("This will measure the LONGEST time between the two clicks of one DOUBLE click."));
					builder.shift();
						widgets = builder.addRow(_("Make a series of DOUBLE clicks"),
									   [	[ new Gtk.Image.new_from_file(Me.path + '/images/mouse-clicks-double.gif'), 1 ],
											[ new Gtk.Label({ label: _("here") + '  \u2192 ', halign: Gtk.Align.END, hexpand: false }), 1 ],
											[ (new dbFinClickMeter.dbFinClickMeter(100, 400, threshold.clickDouble, threshold)).widget, 2 ]
										]);
	                    if (widgets && widgets.length) { widgets[1].hexpand = true; widgets[1].xalign = 0.0; }
	                    widgets = builder.addScale(_("Double clicks time:"), 'mouse-clicks-time-double', 100, 450, 1, null, true);
	                    if (widgets && widgets.length) threshold.scaleDouble = widgets[widgets.length - 1];
					builder.unshift();
					builder.addLabel(_("Based on the data provided above we set the following value (you can adjust it manually):"));
					builder.shift();
	                    widgets = builder.addScale(_("Single/Double clicks threshold:"), 'mouse-clicks-time-threshold', 150, 550, 1);
					builder.unshift();
                    if (widgets && widgets.length) threshold.scaleThreshold = widgets[widgets.length - 1];

                builder.closeNotebook();

			builder.addPage(_("Debug"), 'debug.png');
				builder.addCheckBox(_("Debugging panel on the right side of the rightmost monitor"), 'debug');
				builder.shift();
					builder.addCheckBox(_("Force all messages (\u26a0 ouch!)"), 'debug-force', 'debug');
					builder.addScale(_("Debug panel width\n(% of the monitor width)"), 'debug-width', 10, 70, 1, 'debug');
					builder.addCheckBox(_("Move debug panel to the bottom left"), 'debug-bottom', 'debug');
				builder.unshift();

            builder.closeNotebook();

        return builder.getWidget();
    } // let (builder, widgets)
}
