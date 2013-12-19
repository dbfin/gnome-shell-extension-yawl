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
    let (builder = new dbFinUtilsPrefs.dbFinSettingsWidgetBuilder(),
         widgets = null) {

        builder.addNotebook();

        builder.addActions();
            widgets = builder.addCheckBox(_("Advanced settings") + ' <span color="red">*</span>', 'advanced');
            if (widgets && widgets.length) {
                widgets[0].set_line_wrap(false);
            }

        builder.addPageWelcome('yawl', '<span color="#347">Y</span>et <span color="#347">A</span>nother <span color="#347">W</span>indow <span color="#347">L</span>ist');

		builder.addPage(_("Icons"));
            builder.addNotebook(_("Panel"), 'panel.png');
				builder.addCheckBox(_("Show app icons from all workspaces"), 'icons-show-all');
                builder.addSeparator();
                builder.addScaleScale(_("YAWL-panel position and width"), 'yawl-panel-position', 'yawl-panel-width', 0, 50, 1, 1, 100, 1);
                builder.addSeparator();
                builder.addCheckBox(_("Move central panel"), 'move-center');
                builder.addCheckBox(_("Hide Activities button"), 'hide-activities');
                builder.shift();
				// GNOME Shell 3.8: Hot Corner is not contained in Activities button anymore, no need to "preserve" it
				if (dbFinConsts.arrayShellVersion[0] == 3 && dbFinConsts.arrayShellVersion[1] == 6) {
                    builder.addCheckBox(_("Preserve Hot Corner"), 'preserve-hot-corner', 'hide-activities');
				}
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
				builder.addScale(_("Default icon opacity") + ' <span color="red">*</span>', 'icons-opacity', 50, 100, 1, '@advanced');
	            builder.addLabel('<span size="small" background="#fff0f0">\u26a0 '  + _("Enable option") + ' ' + _("Icons") + ' > ' + _("Panel") + ' > ' +_("Show app icons from all workspaces") + '</span>', [ '@advanced', 'icons-show-all', '@!icons-show-all' ], true);
				builder.addScale(_("Icon opacity if app is not on current workspace") + ' <span color="red">*</span>', 'icons-opacity-other', 10, 100, 1, [ '@advanced', 'icons-show-all' ]);
	            builder.addLabel('<span size="small" background="#fff0f0">\u26a0 '  + _("Enable option") + ' ' + _("Add-ons") + ' > ' + _("Icons") + ' > ' + _("Favorite apps") + '</span>', [ '@advanced', 'icons-favorites', '@!icons-favorites' ], true);
				builder.addScale(_("Icon opacity if app is not running") + ' <span color="red">*</span>', 'icons-opacity-inactive', 10, 100, 1, [ '@advanced', 'icons-favorites' ]);
                builder.addSeparator();
                builder.addScaleScale(_("Clip icons") + ': ' + _("top") + ' &amp; ' + _("bottom") + ' (' + _("px") + ')', 'icons-clip-top', 'icons-clip-bottom', 0, 7, 1, 0, 7, 1);
                builder.addSeparator();
                builder.addScale(_("Align icons on the panel (%)"), 'icons-align', 0, 100, 1);
                builder.addScale(_("Distance between icons") + '\n(' + _("% of icon size") + ')', 'icons-distance', 0, 100, 1);

            builder.addPage(_("Animation"), 'animation.png');
                builder.addScale(_("Animation time in ms (0: no animation)") + ' <span color="red">*</span>', 'icons-animation-time', 0, 1000, 1, '@advanced', true);
                builder.addComboBoxText(_("Animation effect") + ' <span color="red">*</span>', 'icons-animation-effect', dbFinConsts.arrayAnimationTransitions, 0, '@advanced');
                builder.addSeparator('@advanced');
				builder.addCheckBox(_("Animate icons on mouse over"), 'icons-hover-animation');
				builder.shift();
					builder.addScale(_("Change size (%)"), 'icons-hover-size', 100, 200, 1, 'icons-hover-animation');
					builder.addScale(_("Change opacity"), 'icons-hover-opacity', 50, 100, 1, 'icons-hover-animation');
					builder.addCheckBox(_("Show full width if partially hidden") + ' <span color="red">*</span>', 'icons-hover-fit', [ '@advanced', 'icons-hover-animation' ]);
	                builder.addSeparator('@advanced');
	                builder.addScale(_("Mouse over animation time") + '\n(' + _("% of animation time") + ')' + ' <span color="red">*</span>', 'icons-hover-animation-time', 0, 200, 1, [ '@advanced', 'icons-hover-animation' ]);
                    builder.addComboBoxText(_("Mouse over animation effect") + ' <span color="red">*</span>', 'icons-hover-animation-effect', dbFinConsts.arrayAnimationTransitions, 0, [ '@advanced', 'icons-hover-animation' ]);
				builder.unshift();

            builder.addPage(_("Overview"), 'overview.png');
                builder.addCheckBox(_("Show icons in Overview"), 'icons-overview-show');

            builder.closeNotebook();

		builder.addPage(_("Thumbnails"));
			builder.addNotebook(_("Panel"), 'panel_thumbnail.png');
                builder.addCheckBox(_("Show thumbnails when app icon is hovered") + ' <span color="red">*</span>', 'windows-show', '@advanced');
	            builder.addLabel('<span size="small" background="#fff0f0">\u26a0 '  + _("Enable option") + ' ' + _("Thumbnails") + ' > ' + _("Panel") + ' > ' + _("Show thumbnails when app icon is hovered") + ' <span color="red">*</span>' + '</span>', [ 'windows-show', '@!windows-show', '@!advanced' ], true);
				builder.addCheckBox(_("Show thumbnails of 'interesting' windows only") + ' <span color="red">*</span>', 'windows-show-interesting', [ '@advanced', 'windows-show' ]);
                builder.addSeparator('@advanced');
                builder.addCheckBox(_("Use arrow-style thumbnails app indicator") + ' <span color="red">*</span>', 'windows-indicator-arrow', [ '@advanced', 'windows-show' ]);
                builder.addSeparator('@advanced');
                builder.addCheckBox(_("Customize thumbnail panel theme"), 'windows-theming', 'windows-show');
                builder.shift();
                    builder.addCheckBox(_("Match main panel background"), 'windows-background-panel', [ 'windows-show', 'windows-theming' ]);
					builder.addColorButtonScale(_("Background color and opacity"), 'windows-background-color', 'windows-background-opacity', _("Choose thumbnail panel background color"), 0, 100, 1, [ 'windows-show', 'windows-theming', '!windows-background-panel' ]);
					builder.addColorButtonScale(_("Text color and size"), 'windows-text-color', 'windows-text-size', _("Choose thumbnail panel text color"), 6, 36, 1, [ 'windows-show', 'windows-theming' ]);
                    builder.addColorButtonScale(_("Border color and width"), 'windows-border-color', 'windows-border-width', _("Choose thumbnail panel border color"), 0, 3, 1, [ 'windows-show', 'windows-theming' ]);
                    builder.addScaleScale(_("Border radius") + ' ' + _("and") + ' ' + _("Padding") + ' <span color="red">*</span>', 'windows-border-radius', 'windows-padding', 0, 10, 1, 0, 20, 1, [ '@advanced', 'windows-show', 'windows-theming' ]);
                builder.unshift();

			builder.addPage(_("Thumbnails"), 'thumbnail.png', 'windows-show');
	            builder.addLabel('<span size="small" background="#fff0f0">\u26a0 '  + _("Enable option") + ' ' + _("Thumbnails") + ' > ' + _("Panel") + ' > ' + _("Show thumbnails when app icon is hovered") + ' <span color="red">*</span>' + '</span>', [ 'windows-show', '@!windows-show' ], true);
                builder.addCheckBox(_("Same height thumbnails") + ' <span color="red">*</span>', 'windows-thumbnails-fit-height', [ '@advanced' ]);
                builder.addScale(_("Thumbnail maximum width"), 'windows-thumbnails-width', 50, 500, 25, '!windows-thumbnails-fit-height', true);
				builder.addScale(_("Thumbnail maximum height"), 'windows-thumbnails-height', 40, 400, 20, null, true);
                builder.addScale(_("Thumbnail maximum visible height"), 'windows-thumbnails-height-visible', 40, 400, 20, null, true);
                builder.addSeparator();
				builder.addScale(_("Default thumbnail opacity") + ' <span color="red">*</span>', 'windows-thumbnails-opacity', 50, 100, 1, '@advanced');
				builder.addScale(_("Minimized thumbnail opacity") + ' <span color="red">*</span>', 'windows-thumbnails-minimized-opacity', 10, 100, 1, '@advanced');
                builder.addSeparator('@advanced');
                builder.addScale(_("Distance between thumbnails") + '\n(' + _("% of thumbnail size") + ')', 'windows-thumbnails-distance', 0, 50, 1);
                builder.addScale(_("Thumbnail top padding (px)") + ' <span color="red">*</span>', 'windows-thumbnails-padding-top', 0, 20, 1, '@advanced');

			builder.addPage(_("Animation"), 'animation_thumbnail.png', 'windows-show');
	            builder.addLabel('<span size="small" background="#fff0f0">\u26a0 '  + _("Enable option") + ' ' + _("Thumbnails") + ' > ' + _("Panel") + ' > ' + _("Show thumbnails when app icon is hovered") + ' <span color="red">*</span>' + '</span>', [ 'windows-show', '@!windows-show' ], true);
                builder.addScale(_("Thumbnails show delay in ms"), 'windows-show-delay', 0, 1000, 1, null, true);
                builder.addScale(_("Animation time in ms (0: no animation)") + ' <span color="red">*</span>', 'windows-animation-time', 0, 500, 1, '@advanced', true);
                builder.addComboBoxText(_("Animation effect") + ' <span color="red">*</span>', 'windows-animation-effect', dbFinConsts.arrayAnimationTransitions, 0, '@advanced');
                builder.addSeparator();
				builder.addLabel(_("Animate thumbnails on mouse over"));
                builder.shift();
					builder.addScale(_("Change opacity"), 'windows-hover-opacity', 50, 100, 1);
					builder.addCheckBox(_("Show full width if partially hidden") + ' <span color="red">*</span>', 'windows-hover-fit', '@advanced');
	                builder.addSeparator('@advanced');
	                builder.addScale(_("Mouse over animation time") + '\n(' + _("% of animation time") + ')' + ' <span color="red">*</span>', 'windows-hover-animation-time', 0, 200, 1, '@advanced');
                    builder.addComboBoxText(_("Mouse over animation effect") + ' <span color="red">*</span>', 'windows-hover-animation-effect', dbFinConsts.arrayAnimationTransitions, 0, '@advanced');
                builder.unshift();

            builder.closeNotebook();

        builder.addPage(_("Behavior"));
            builder.addNotebook(_("Mouse"), 'mouse.png');
				builder.addNotebook();

				builder.setWidthRight(5);

                builder.addPage(_("Icons"), 'icon_16.png');
					builder.addNotebook(_("Left button"), 'mouse-left.png');
						builder.addComboBoxText(_("Click : Double click"), 'mouse-app-left', dbFinConsts.arrayAppClickFunctions, 0);
						builder.addComboBoxText(_("Ctrl + Click : Double click"), 'mouse-app-left-ctrl', dbFinConsts.arrayAppClickFunctions, 0);
						builder.addComboBoxText(_("Shift + Click : Double click"), 'mouse-app-left-shift', dbFinConsts.arrayAppClickFunctions, 0);
						builder.addComboBoxText(_("Ctrl + Shift + Click : Double click"), 'mouse-app-left-ctrl-shift', dbFinConsts.arrayAppClickFunctions, 0);

					builder.addPage(_("Middle button"), 'mouse-middle.png');
						builder.addComboBoxText(_("Click : Double click"), 'mouse-app-middle', dbFinConsts.arrayAppClickFunctions, 0);
						builder.addComboBoxText(_("Ctrl + Click : Double click"), 'mouse-app-middle-ctrl', dbFinConsts.arrayAppClickFunctions, 0);
						builder.addComboBoxText(_("Shift + Click : Double click"), 'mouse-app-middle-shift', dbFinConsts.arrayAppClickFunctions, 0);
						builder.addComboBoxText(_("Ctrl + Shift + Click : Double click"), 'mouse-app-middle-ctrl-shift', dbFinConsts.arrayAppClickFunctions, 0);
						builder.addSeparator();
	                    builder.addLabel('<span size="small" background="#fff0f0">\u26a0 ' + _("Disable option") + ' ' + _("Add-ons") + ' > ' + _("Panel") + ' > ' + _("Scroll to change workspace") + '</span>', [ '!mouse-scroll-workspace', '@mouse-scroll-workspace' ], true);
						builder.addComboBoxText(_("Scroll up : down"), 'mouse-app-scroll', dbFinConsts.arrayAppClickFunctions, 0, '!mouse-scroll-workspace');
                        builder.shift();
                            builder.addCheckBox(_("Do not launch apps with scroll"), 'mouse-app-scroll-no-launch', '!mouse-scroll-workspace');
                        builder.unshift();

					builder.addPage(_("Right button"), 'mouse-right.png');
						builder.addComboBoxText(_("Click : Double click"), 'mouse-app-right', dbFinConsts.arrayAppClickFunctions, 0);

					builder.closeNotebook();

                builder.addPage(_("Thumbnails"), 'thumbnail_16.png', 'windows-show');
		            builder.addLabel('<span size="small" background="#fff0f0">\u26a0 '  + _("Enable option") + ' ' + _("Thumbnails") + ' > ' + _("Panel") + ' > ' + _("Show thumbnails when app icon is hovered") + ' <span color="red">*</span>' + '</span>', [ 'windows-show', '@!windows-show' ], true);
					builder.addNotebook(_("Left button"), 'mouse-left.png');
						builder.addComboBoxText(_("Click"), 'mouse-window-left', dbFinConsts.arrayWindowClickFunctions, 0);
						builder.addComboBoxText(_("Ctrl + Click"), 'mouse-window-left-ctrl', dbFinConsts.arrayWindowClickFunctions, 0);
						builder.addComboBoxText(_("Shift + Click"), 'mouse-window-left-shift', dbFinConsts.arrayWindowClickFunctions, 0);
						builder.addComboBoxText(_("Ctrl + Shift + Click"), 'mouse-window-left-ctrl-shift', dbFinConsts.arrayWindowClickFunctions, 0);

					builder.addPage(_("Middle button"), 'mouse-middle.png');
						builder.addComboBoxText(_("Click"), 'mouse-window-middle', dbFinConsts.arrayWindowClickFunctions, 0);
						builder.addSeparator();
						builder.addComboBoxText(_("Scroll up"), 'mouse-window-scroll-up', dbFinConsts.arrayWindowClickFunctions, 0);
						builder.addComboBoxText(_("Scroll down"), 'mouse-window-scroll-down', dbFinConsts.arrayWindowClickFunctions, 0);

					builder.addPage(_("Right button"), 'mouse-right.png');
						builder.addComboBoxText(_("Click"), 'mouse-window-right', dbFinConsts.arrayWindowClickFunctions, 0);

					builder.closeNotebook();

				builder.setWidthRight(4);

                builder.addPage(_("Fine-tuning") + ' <span color="red">*</span>', 'tuning.png', '@advanced');
    				builder.addNotebook(_("Mouse events"));
	                    builder.addCheckBox(_("Use mouse drag-and-drop"), 'mouse-drag-and-drop');
	                    builder.addCheckBox(_("Register mouse events on button release"), 'mouse-click-release', '!mouse-drag-and-drop');
					    builder.shift();
						    builder.addCheckBox(_("Long left button click = right button click"), 'mouse-long-click', [ '@mouse-drag-and-drop' ]);
						    builder.addCheckBox(_("Long left button click = right button click"), 'mouse-long-click', [ '@!mouse-drag-and-drop', 'mouse-click-release' ]);
					    builder.unshift();
	                    builder.addSeparator();
                        builder.addLabel(_("Scroll timeout: the time after one scroll event during which other scroll events are rejected."));
					    builder.shift();
                            builder.addScale(_("Mouse scroll timeout"), 'mouse-scroll-timeout', 25, 1000, 25);
					    builder.unshift();

                    builder.addPage(_("Single vs Double clicks"));
                        let threshold = new dbFinClicksThreshold();
                        builder.getWidget()._threshold = threshold;
					    builder.addLabel(_("This will measure the SHORTEST time between two consecutive SINGLE clicks."));
					    builder.shift();
						    widgets = builder.addRow(_("A fast series of SINGLE clicks"),
									       [	[ Gtk.Image.new_from_file(Me.path + '/images/mouse-clicks-single.gif'), 1 ],
											    [ new Gtk.Label({ label: _("click here") + '  \u2192 ', halign: Gtk.Align.END, hexpand: false }), 2 ],
											    [ (new dbFinClickMeter.dbFinClickMeter(250, 625, threshold.clickSingle, threshold)).widget, 1 ]
										    ]);
	                        if (widgets && widgets.length) {
							    widgets[1].hexpand = true;
							    widgets[1].xalign = 0.0;
						    }
	                        widgets = builder.addScale(_("Consequent single clicks time:"), 'mouse-clicks-time-single', 250, 750, 1, null, true);
	                        if (widgets && widgets.length) {
							    threshold.scaleSingle = widgets[widgets.length - 1];
						    }
					    builder.unshift();
					    builder.addLabel(_("This will measure the LONGEST time between the two clicks of one DOUBLE click."));
					    builder.shift();
						    widgets = builder.addRow(_("A series of DOUBLE clicks"),
									       [	[ Gtk.Image.new_from_file(Me.path + '/images/mouse-clicks-double.gif'), 1 ],
											    [ new Gtk.Label({ label: _("click here") + '  \u2192 ', halign: Gtk.Align.END, hexpand: false }), 2 ],
											    [ (new dbFinClickMeter.dbFinClickMeter(100, 400, threshold.clickDouble, threshold)).widget, 1 ]
										    ]);
	                        if (widgets && widgets.length) {
							    widgets[1].hexpand = true;
							    widgets[1].xalign = 0.0;
						    }
	                        widgets = builder.addScale(_("Double clicks time:"), 'mouse-clicks-time-double', 100, 450, 1, null, true);
	                        if (widgets && widgets.length) {
							    threshold.scaleDouble = widgets[widgets.length - 1];
						    }
					    builder.unshift();
					    builder.addLabel(_("Based on the data provided above we set the following value (you can adjust it manually):"));
					    builder.shift();
	                        widgets = builder.addScale(_("Single/Double clicks threshold:"), 'mouse-clicks-time-threshold', 150, 550, 1);
						    if (widgets && widgets.length) {
							    threshold.scaleThreshold = widgets[widgets.length - 1];
						    }
					    builder.unshift();

                    builder.closeNotebook();

                builder.closeNotebook();

            builder.addPage(_("Animation") + ' <span color="red">*</span>', 'animation_engine.png', '@advanced');
                builder.addCheckBox(_("Disable all animation"), 'animation-disable');
                builder.addCheckBox(_("Use alternative animation engine (experimental)"), 'animation-alternative-test', '!animation-disable');
                builder.shift();
                    builder.addLabel(_("Lower FPS = better responsiveness, higher FPS = smoother animation"), [ '!animation-disable', 'animation-alternative-test' ]);
                    builder.addScale(_("Frames per second"), 'animation-alternative-fps', 10, 50, 1, [ '!animation-disable', 'animation-alternative-test' ]);
                builder.unshift();

			builder.addPage(_("Debug") + ' <span color="red">*</span>', 'debug.png', '@advanced');
				builder.addLabel(_("These options are for developers only."));
				builder.addSeparator();
				builder.addLabel(_("Debugging panel shows a hierarchical structure of internal function calls."));
				builder.addLabel(_("The panel has a small toolbar which allows one to:"));
				builder.shift();
					builder.addLabel('\u00b7 ' + _("pin the panel (so that it is always visible)"));
					builder.addLabel('\u00b7 ' + _("stop, resume and clear all messages"));
					builder.addLabel('\u00b7 ' + _("access extension preferences"));
					builder.addLabel('\u00b7 ' + _("restart the extension"));
				builder.unshift();
				builder.addCheckBox(_("Debugging panel"), 'debug');
				builder.shift();
					builder.addLabel(_("By default the panel is placed at the right side (of the last monitor)."), 'debug');
					builder.addCheckBox(_("Move the panel to the bottom left"), 'debug-bottom', 'debug');
					builder.addScale(_("Debug panel width") + '\n(' + _("% of the monitor width") + ')', 'debug-width', 10, 70, 1, 'debug');
					builder.addCheckBox(_("Force all messages") + ' (\u26a0 ' + _("ouch!") + ')', 'debug-force', 'debug');
				builder.unshift();

            builder.closeNotebook();

		builder.addPage(_("Add-ons"));
            builder.addNotebook(_("Panel"), 'panel.png');
                builder.addLabel('<span size="small" background="#fff0f0">\u26a0 ' + _("Enable option") + ' ' + _("Behavior") + ' > ' + _("Mouse") + ' > ' + _("Fine-tuning") + ' <span color="red">*</span>' + ' > ' + _("Mouse events") + ' > ' +_("Use mouse drag-and-drop") + '</span>', [ 'mouse-drag-and-drop', '@!mouse-drag-and-drop' ], true);
                builder.addCheckBox('<b>' + _("Rearrange icons on the panel using mouse") + '</b>', 'icons-drag-and-drop', 'mouse-drag-and-drop');
                builder.addSeparator();
				builder.addCheckBox('<b>' + _("Scroll to change workspace") + '</b>: ' + _("Scroll over YAWL panel to change workspace"), 'mouse-scroll-workspace');
                builder.shift();
                    builder.addLabel('<span size="small" background="#fff0f0">\u26a0 '  + _("Enable option") + ' ' + _("Icons") + ' > ' + _("Panel") + ' > ' +_("Show app icons from all workspaces") + '</span>', [ 'icons-show-all', '@!icons-show-all' ], true);
                    builder.addLabel('<span size="small" background="#fff0f0">\u26a0 '  + _("Enable option") + ' ' + _("Thumbnails") + ' > ' + _("Panel") + ' > ' + _("Show thumbnails when app icon is hovered") + ' <span color="red">*</span>' + '</span>', [ 'windows-show', '@!windows-show' ], true);
                    builder.addCheckBox('<b>' + _("Scroll to find other windows") + '</b>: ' + _("find app's windows on other workspaces by scrolling over its icon when its thumbnails are shown"), 'mouse-scroll-workspace-search', [ 'mouse-scroll-workspace', 'icons-show-all', 'windows-show' ]);
                builder.unshift();

            builder.addPage(_("Icons"), 'icon.png');
                builder.addCheckBox('<b>' + _("Window demanding attention") + '</b>: ' + _("blink"), 'icons-attention-blink');
                builder.shift();
        			builder.addScale(_("Blinking rate (times per minute)"), 'icons-attention-blink-rate', 15, 125, 1, 'icons-attention-blink');
                builder.unshift();
                builder.addSeparator();
			    builder.addCheckBox('<b>Quicklists</b>: ' + _("requires extension") + ' Quicklists (' + _("author") + ': Damian)', 'app-quicklists');
                builder.addSeparator();
			    builder.addCheckBox('<b>' + _("Favorite apps") + '</b>: ' + _("always show"), 'icons-favorites');
                builder.shift();
                    builder.addCheckBoxScale(_("Use smaller icons if not running"), 'icons-favorites-smaller', 'icons-favorites-size', 1, 3, 1, 'icons-favorites', false, true);
                builder.unshift();
                builder.addSeparator();
                builder.addComboBoxText('<b>' + _("Windows indicators") + '</b>', 'icons-windows-indicator', dbFinConsts.arrayWindowsIndicatorTypes, 0);
                builder.shift();
				    builder.addColorButton(_("Choose windows indicator color"), 'icons-windows-indicator-color', _("Choose windows indicator color"));
                builder.unshift();

            builder.addPage(_("Thumbnails"), 'thumbnail.png', 'windows-show');
			    builder.addLabel('<span size="small" background="#fff0f0">\u26a0 '  + _("Enable option") + ' ' + _("Thumbnails") + ' > ' + _("Panel") + ' > ' + _("Show thumbnails when app icon is hovered") + ' <span color="red">*</span>' + '</span>', [ 'windows-show', '@!windows-show' ], true);
			    builder.addLabel('<b>' + _("Window Peeking") + '</b>: ' + _("scroll up/down over a thumbnail to turn previews on/off and to reduce panel opacity while previewing") + '.', 'windows-show', true);
                builder.shift();
				    builder.addCheckBox(_("Preview window when its thumbnail is hovered") + ' <span color="red">*</span>', 'windows-preview', [ '@advanced', 'windows-show' ]);
				    builder.addColorButtonScale(_("Dim background: color and opacity"), 'windows-preview-dim-color', 'windows-preview-dim-opacity', _("Choose dimmed background color"), 0, 75, 1, [ 'windows-preview', 'windows-show' ]);
				    builder.addScale(_("Reduced thumbnails panel opacity"), 'windows-preview-panel-opacity', 5, 75, 1, [ 'windows-preview', 'windows-show' ]);
                builder.unshift();

            builder.closeNotebook();

        builder.addPageREI('yawl');

		builder.addPage(_("Did you know?"));
			builder.addLabel('YAWL (<span color="#347">Y</span>et <span color="#347">A</span>nother <span color="#347">W</span>indow <span color="#347">L</span>ist)'
							 + ' ' + _("is designed to be simple to use yet highly customizable."), null, true, 3);
			builder.shift();
				builder.addLabel('<span size="small">' +
								 (Math.floor((dbFinConsts.Settings.length - 1) / 10) * 10) + '+'
								 + ' ' + _("settings are currently available to customize feel and look of the extension.")
								 + ' ' + _("Exploring the options also helps you to uncover some hidden features.")
								 + ' ' + _("For example, <b>did you know</b> that there is an option to preview a window when its thumbnail is hovered, and that you can easily switch it on and off just by scrolling the middle mouse button over the thumbnail?")
								 + '</span>', null, true, 3);
			builder.unshift();
			builder.addLabel('YAWL (<span color="#347">Y</span>et <span color="#347">A</span>nother <span color="#347">W</span>indow <span color="#347">L</span>ist)'
							 + ' ' + _("is active workspace centric."), null, true, 3);
			builder.shift();
				builder.addLabel('<span size="small">' +
								 _("It highlights icons of apps and shows windows open on the current active workspace.")
								 + ' ' + _("App icons highlighted on the top panel are indicative of what workspace you are currently on and what task/activity it is intended for.")
				                 + ' ' + _("You can even optionally hide app icons not present on the active workspace.")
								 + ' ' + _("Most of the extension's functionality (such as cycling through windows) is also active-workspace-oriented.")
								 + ' ' + _("For quick access to favorites")
								 + ' ' + _("please consider installing in addition this highly recommended extension:")
								 + ' ' + '<b>Dash to Dock</b> (' + _("author") + ': <b>michele_g</b>).'
								 + '</span>', null, true, 3);
			builder.unshift();
			builder.addLabel('YAWL (<span color="#347">Y</span>et <span color="#347">A</span>nother <span color="#347">W</span>indow <span color="#347">L</span>ist)'
							 + ' ' + _("tries to seamlessly integrate into the GNOME Shell panel."), null, true, 3);
			builder.shift();
				builder.addLabel('<span size="small">' +
								 _("It is embedded into the panel right where there is space for it not claimed by anything else, and uses panel theme by default.")
								 + ' ' + _("It further allows you to hide some unnecessary buttons on the left and shift the central panel to the right to give itself more space.")
								 + ' ' + _("You can tweak the panel even more by installing some of the following recommended extensions:")
								 + ' ' + '<b>Frippery Move Clock</b> (' + _("author") + ': <b>rmyorston</b>), <b>Status Area Horizontal Spacing</b> (' + _("author") + ': <b>mathematical.coffee</b>), <b>User Themes</b> (' + _("author") + ': <b>gcampax</b>).'
								 + '</span>', null, true, 3);
			builder.unshift();
			builder.addLabel('YAWL (<span color="#347">Y</span>et <span color="#347">A</span>nother <span color="#347">W</span>indow <span color="#347">L</span>ist)'
							 + ' ' + _("is a part of greater FOSS."), null, true, 3);
			builder.shift();
				builder.addLabel('<span size="small">' +
								 _("And as such it is completely free to use, study, distribute and modify provided you acknowledge all the copyrights and your actions comply with the applicable law and GNU GPL.")
								 + '</span>', null, true, 3);
				builder.addLabel('<span size="small">' +
								 _("Your contribution in the form of feature suggestions, bug reports, translations, donations or even development is highly appreciated.")
								 + '</span>', null, true, 3);
				builder.addLabel('<span size="small">' +
								 _("The development of this extension would not be possible without this wonderful FOSS:")
								 + ' ' + '<b>Anjuta</b>, <b>Inkscape</b>, <b>Gimp</b>, <b>OmegaT</b>, <b>Ubuntu</b>, <b>Fedora</b> ' + _("and, of course,") + ' <b>GNOME Shell</b>!'
								 + '</span>', null, true, 3);
			builder.unshift();

		_D('<');
        return builder.getWidget();
    } // let (builder, widgets)
}
