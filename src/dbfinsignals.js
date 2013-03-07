/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
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

const _D = Me.imports.dbfindebug._D;

/* class dbFinSignals: keeps track of connected signals
 */
const dbFinSignals = new Lang.Class({
    Name: 'dbFin.Signals',

    _init: function() {
        _D('>dbFinSignals._init()');
        this._signalsNoId = [];
		this._signalsId = new dbFinArrayHash.dbFinArrayHash();
        _D('<');
    },

    destroy: function() {
        _D('>dbFinSignals.destroy()');
		if (this._signalsNoId && this._signalsId) {
			this.disconnectAll();
			this._signalsNoId = null;
			this._signalsId.destroy();
			this._signalsId = null;
		}
        _D('<');
    },

    connectNoId: function(escs, after/* = false*/) {
        _D('>dbFinSignals.connectNoId()');
        if (!escs) {
            _D('escs === null');
            _D('<');
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
        _D('<');
    },

	disconnectAllNoId: function() {
        _D('>dbFinSignals.disconnectAllNoId()');
		while (this._signalsNoId.length) {
			let (ies = this._signalsNoId.pop()) {
				if (ies['emitter']) {
                    ies['emitter'].disconnect(ies['id']);
                    ies['emitter'] = null;
                }
			}
		}
        _D('<');
	},

	connectId: function (textId, escs, after/* = false*/) {
        _D('>dbFinSignals.connectId()');
        if (!escs || !textId || textId == '') {
            _D(!escs ? 'escs === null' : 'textId === null');
            _D('<');
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
        _D('<');
	},

	disconnectId: function (textId) {
        _D('>dbFinSignals.disconnectId()');
		let (ies = this._signalsId.remove(textId)) {
			if (ies !== undefined && ies['emitter']) {
				ies['emitter'].disconnect(ies['id']);
                ies['emitter'] = null;
			}
		}
        _D('<');
	},

	disconnectAllId: function () {
        _D('>dbFinSignals.disconnectAllId()');
		let (ids = this._signalsId.getKeys()) {
			for (let i = ids.length - 1; i >= 0; --i) {
				this.disconnectId(ids[i]); // not optimal but stable
			}
		}
        _D('<');
	},

	disconnectAll: function () {
        _D('>dbFinSignals.disconnectAll()');
		this.disconnectAllNoId();
		this.disconnectAllId();
        _D('<');
	}
});