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
 * dbfinsignals.js
 * Signals connecting and disconnecting.
 *
 * dbFinSignals     keeps track of connected signals (identified by unique text ID's, or no-name signals)
 *                  Methods:
 *						connectNoId({ emitter:, signal:, callback:, scope: }, after?)		Connect signal, no text ID
 *                                                                                          after: if true use connect_after
 *						disconnectAllNoId()     											Remove all connected no-ID signals
 *						connectId(textId, { emitter:, signal:, callback:, scope: }, after?)	Connect signal with text ID
 *                                                                                          after: if true use connect_after
 *						disconnectId(textId)        										Disconnect signal by text ID
 *						disconnectAllId()       											Disconnect all signals with text IDs
 *						disconnectAll()     												Disconnect all signals
 *
 */

const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

/* class dbFinSignals: keeps track of connected signals
 */
const dbFinSignals = new Lang.Class({
    Name: 'dbFin.Signals',

    _init: function() {
        this._signalsNoId = [];
		this._signalsId = new dbFinArrayHash.dbFinArrayHash();
    },

    destroy: function() {
		if (this._signalsNoId && this._signalsId) {
			this.disconnectAll();
			this._signalsNoId = null;
			this._signalsId.destroy();
			this._signalsId = null;
		}
    },

    connectNoId: function(escs, after/* = false*/) {
        if (!escs) {
            log('Warning: dbFinSignals.connectNoId: escs === null');
            return;
        }
        after = after || false;
		let (	emitter = escs['emitter'],
				signal = escs['signal'],
				callback = escs['callback'],
				scope = escs['scope']) {
            if (emitter && (!after && emitter.connect || after && emitter.connect_after)
                && signal && signal != '' && scope && callback) {
                let (id = (!after   ? emitter.connect(signal, Lang.bind(scope, callback))
                                    : emitter.connect_after(signal, Lang.bind(scope, callback)))) {
                    this._signalsNoId.push({ 'id': id, 'emitter': emitter, 'signal': signal });
                }
            }
		}
    },

	disconnectAllNoId: function() {
		while (this._signalsNoId.length) {
			let (ies = this._signalsNoId.pop()) {
				if (ies['emitter']) {
                    try { ies['emitter'].disconnect(ies['id']); } catch (e) {}
                    ies['emitter'] = null;
                }
			}
		}
	},

	connectId: function (textId, escs, after/* = false*/) {
        if (!escs || !textId || textId == '') {
            log('Warning: dbFinSettings.connectId: ' + (!escs ? 'escs === null' : 'textId === null'));
            return;
        }
        after = after || false;
		this.disconnectId(textId);
		let (	emitter = escs['emitter'],
				signal = escs['signal'],
				callback = escs['callback'],
				scope = escs['scope']) {
            if (emitter && (!after && emitter.connect || after && emitter.connect_after)
                && signal && signal != '' && scope && callback) {
                let (id = (!after   ? emitter.connect(signal, Lang.bind(scope, callback))
                                    : emitter.connect_after(signal, Lang.bind(scope, callback)))) {
                    this._signalsId.set(textId, { 'id': id, 'emitter': emitter, 'signal': signal });
                }
            }
		}
	},

	disconnectId: function (textId) {
		let (ies = this._signalsId.remove(textId)) {
			if (ies !== undefined && ies['emitter']) {
				try { ies['emitter'].disconnect(ies['id']); } catch (e) {}
                ies['emitter'] = null;
			}
		}
	},

	disconnectAllId: function () {
		let (ids = this._signalsId.getKeys()) {
			for (let i = ids.length - 1; i >= 0; --i) {
				this.disconnectId(ids[i]); // not optimal but stable
			}
		}
	},

	disconnectAll: function () {
		this.disconnectAllNoId();
		this.disconnectAllId();
	}
});
