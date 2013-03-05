/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * .js
 * Description
 *
 */

const Cairo = imports.cairo;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Clutter = imports.gi.Clutter;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Convenience = Me.imports.convenience2;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const dbFinClickMeter = new Lang.Class({
    Name: 'dbFin.ClickMeter',

    _init: function(minTime, maxTime, clicksCallback, clicksCallbackScope) {
		this._minTime = minTime || 1;
		this._maxTime = maxTime || this._minTime;
		this._clicksCallback = clicksCallback || null;
		this._clicksCallbackScope = clicksCallbackScope || null;
        this.widget = new Gtk.DrawingArea();
		this.widget.connect('draw', Lang.bind(this, this._draw));
		this._clicks = [];
		this._clicksi = 0;
		this._clicksilast = undefined;
		for (let i = 0; i < 256; ++i) this._clicks[i] = 0;
		this._timeout = Mainloop.timeout_add(25, Lang.bind(this, this._onTimeout));
		this._connectId = this.widget.connect('button-press-event', Lang.bind(this, this._onButtonPress));
		this.widget.add_events(1 << 8);
    },

    destroy: function() {
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }
		if (this._connectId) {
			this.widget.disconnect(this._connectId);
			this._connectId = null;
		}
		if (this.widget) {
			this.widget.destroy();
			this.widget = null;
		}
		this._clicksCallback = null;
        this._clicks = [];
    },

	_draw: function(widget, cairo, data) {
        let (	w = widget.get_allocated_width(),
             	h = widget.get_allocated_height(),
		     	sc = widget.get_style_context()
             ) {
			if (!w || !h) return false;
			cairo.setLineWidth(1);
			cairo.rectangle(0, 0, w, h);
			Clutter.cairo_set_source_color(cairo, new Clutter.Color({ red: 255, green: 255, blue: 255, alpha: 255 }));
			cairo.fill();
			let (y = Math.round(h * 0.84) + 0.5, yt = Math.round(h * 0.16) + 0.5, ad = Math.floor(255 / Math.min(255, w - 1))) {
				cairo.moveTo(0, y);
				cairo.lineTo(w, y);
				Clutter.cairo_set_source_color(cairo, new Clutter.Color({ red: 0, green: 0, blue: 0, alpha: 255 }));
				cairo.stroke();
				let (gradient = new Cairo.LinearGradient(0, 0, w, h)) {
					gradient.addColorStopRGBA(0, 0, 0, 0, 1);
					gradient.addColorStopRGBA(Math.min(0.92, 255. / w), 0, 0, 0, 0);
					cairo.setSource(gradient);
				}
				w = Math.min(256, w);
				for (let i = this._clicksi, x = 0; i = ((i - 1) & 255), x < w; ++x) {
					if (this._clicks[i] > 1) {
						cairo.rectangle(x, yt, this._clicks[i], y - yt);
						cairo.fill();
						x += this._clicks[i] - 1;
						i -= this._clicks[i] - 1;
					}
					else if (this._clicks[i] == 1) {
						cairo.moveTo(x + 0.5, yt);
						cairo.lineTo(x + 0.5, y);
						cairo.stroke();
					}
				}
			}
			return false;
        }
	},

    _onTimeout: function() {
		this._clicksi = (this._clicksi + 1) & 255;
		if (this._clicks[this._clicksi]) {
	        this._clicks[this._clicksi] = 0;
			if (this._clicksilast === this._clicksi) this._clicksilast = undefined;
		}
        this.widget.queue_draw_area(0, 0, 256, 256);
		return true;
    },

	_onButtonPress: function(actor, event) {
		let (cur = this._clicksi, ticks = 1) {
			if (this._clicksilast !== undefined) {
				ticks = (cur - this._clicksilast) & 255;
				let (time = ticks * 25) {
					if (time < this._minTime || time > this._maxTime) {
						ticks = 1;
					}
					else if (this._clicksCallback) {
						if (this._clicksCallbackScope)
							Lang.bind(this._clicksCallbackScope, this._clicksCallback)(time);
						else
							this._clicksCallback(time);
					}
				} // let (time)
			} // if (this._clicksilast !== undefined)
			this._clicks[cur] = Math.max(this._clicks[cur], ticks);
			this._clicksilast = cur;
		} // let (cur, ticks)
	}
});
