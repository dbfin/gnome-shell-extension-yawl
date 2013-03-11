/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinutils.js
 * Common utilities.
 *
 * Functions:
 * now:justnumbers->string		returns current date/time as a toString string or as a 'yyyyMMddHHmmss' string
 * 								Parameters:
 *									justnumbers		set true to return just numbers, otherwise returns Date.toString()
 *
 * settingsParseInt(s, k, min, max, d)  returns a number parsed from settings key:string
 *                              Parameters:
 *                                  s               the settings
 *                                  k               the key
 *                                  min, max        minimum and maximum values allowed
 *                                  d               default value (if cannot read or parse the value)
 *
 * settingsGetBoolean(s, k, d)	returns a boolean value from settings key:boolean
 * 								Parameters:
 * 									s				the settings
 * 									k				the key
 * 									d				default value (if cannot read the value)
 *
 * settingsGetString(s, k, d)	returns a string value from settings key:string
 * 								Parameters:
 * 									s				the settings
 * 									k				the key
 * 									d				default value (if cannot read the value)
 *
 * settingsGetInteger(s, k, d)	returns an integer value from settings key:integer
 * 								Parameters:
 * 									s				the settings
 * 									k				the key
 * 									d				default value (if cannot read the value)
 *
 * settingsGetGlobalSettings(schemaName)    returns Gio.Settings object corresponding to schemaName or null
 *
 * settingsVariable(s, k, i, p, c)  given s._settings key k=='settings-key' creates s._settingsKey=i
 *                                  and binds it (using s._signals) to the settings key k,
 *                                  automatically updates it (using additional properties p if needed),
 *                                  and calls callback c after that
 * 									s				scope (the variable's object)
 * 									k				the settings key
 * 									i				the variable's initial value
 * 									p				additional parameters for updating (like { min:, max: })
 * 									c				the callback function after updating
 *
 * opacity100to255(opacity)		converts opacity 0-100 to 0-255
 *
 * setBox:box,x1,y1,x2,y2		sets x1, y1, x2, y2 of Clutter.ActorBox (or another class supporting these properties)
 * 								Parameters:
 *									box, x1, y1, x2, y2
 *
 * zip:[a],[b],l?->[[a,b]]		Haskell-like function zipping two arrays
 *								Parameters:
 * 									[a] and [b] are input arrays
 * 									l if specified defines the length or the resulting array
 * unzip:[[a,b]]->[[a],[b]]		Haskell-like function unzipping array of pairs
 *								Parameters:
 * 									[[a,b]] is the input array of pairs
 *
 * stringRepeat(s, n)			returns the string s repeated n times
 *
 */

const Lang = imports.lang;

const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const _D = Me.imports.dbfindebug._D;

/* function now: returns current date/time
 * Parameters:
 *     justnumbers == true:  returns in format 'yyyyMMddHHmmss'
 *                 == false: returns in Date.toString() format
 */
function now(justnumbers) {
    let (now = new Date()) {
        if (!justnumbers) {
            return now.toString();
        }
        else {
            // leading0 -- not to have to deal with all the JS Date format mess!
            let (leading0 = function (n) { if (n < 10) return '0' + n; else return '' + n; }) {
                return    now.getFullYear()
                        + leading0(now.getMonth() + 1)
                        + leading0(now.getDate())
                        + leading0(now.getHours())
                        + leading0(now.getMinutes())
                        + leading0(now.getSeconds());
            } // let (leading0)
        } // if (!justnumbers) else
    } // let (now)
}

/* function settingsParseInt(s, k, min, max, d): returns a number parsed from settings key:string
 * Parameters:
 *     s               the settings
 *     k               the key
 *     min, max        minimum and maximum values allowed
 *     d               default value (if cannot read or parse the value)
 */
function settingsParseInt(s, k, min, max, d) {
    if (!s || !s.list_keys || !s.get_string || !k || k == '') return d;
	if (s.list_keys().indexOf(k) == -1) return d;
    if (min === undefined) min = null;
    if (max === undefined) max = null;
    if (min !== null && max !== null && min > max) return d;
    let (value = parseInt(s.get_string(k))) {
        if (isNaN(value)) return d;
        if (min !== null && value < min) value = min; // else is fine: the two conditions never happen simultaneously
        else if (max !== null && value > max) value = max; // (because if min !== null & max !== null then min <= max)
        return value;
    } // let (value)
}

/* function settingsGetBoolean(s, k, d): returns a boolean value from settings key:boolean
 * Parameters:
 * 		s				the settings
 * 		k				the key
 * 		d				default value (if cannot read the value)
 */
function settingsGetBoolean(s, k, d) {
    if (!s || !s.list_keys || !s.get_boolean || !k || k == '') return d;
	if (s.list_keys().indexOf(k) == -1) return d;
	return s.get_boolean(k);
}

/* function settingsGetString(s, k, d): returns a string value from settings key:string
 * Parameters:
 * 		s				the settings
 * 		k				the key
 * 		d				default value (if cannot read the value)
 */
function settingsGetString(s, k, d) {
    if (!s || !s.list_keys || !s.get_string || !k || k == '') return d;
	if (s.list_keys().indexOf(k) == -1) return d;
	return s.get_string(k);
}

/* function settingsGetInteger(s, k, d): returns an integer value from settings key:integer
 * Parameters:
 * 		s				the settings
 * 		k				the key
 * 		d				default value (if cannot read the value)
 */
function settingsGetInteger(s, k, d) {
    if (!s || !s.list_keys || !s.get_int || !k || k == '') return d;
	if (s.list_keys().indexOf(k) == -1) return d;
	return s.get_int(k);
}

/* settingsGetGlobalSettings(schemaName): returns Gio.Settings object corresponding to schemaName or null
 */
function settingsGetGlobalSettings(schemaName) {
    if (!schemaName || (schemaName = '' + schemaName) == '') return null;
    let (schemaSource = Gio.SettingsSchemaSource.get_default()) {
        let (schemaObject = schemaSource && schemaSource.lookup(schemaName, true)) {
            return schemaObject ? new Gio.Settings({ settings_schema: schemaObject }) : null;
        }
    }
}

/* settingsVariable(s, k, i, p, c)  given s._settings key k=='settings-key' creates s._settingsKey=i
 *                                  and binds it (using s._signals) to the settings key k,
 *                                  automatically updates it (using additional properties p if needed),
 *                                  and calls callback c after that
 * 									s				scope (the variable's object)
 * 									k				the settings key
 * 									i				the variable's initial value
 * 									p				additional parameters for updating (like { min:, max: })
 * 									c				the callback function after updating
 */
function settingsVariable(s, k, i, p, c) {
    if (!s || !s._settings || !s._settings.connect || !s._settings.list_keys
        || !s._signals || !s._signals.connectNoId
        || i === undefined || i === null
        || !k || (k = '' + k) == '' || s._settings.list_keys().indexOf(k) == -1) return;
	p = p || {};
	if (c === undefined) c = null;
	let (n = '_' + k.replace(/[ \t]/g, '').replace(/\-[^-]+/g, function (m) { return m[1].toUpperCase() + m.substring(2); })) {
		let (cn = '_updated' + n[1].toUpperCase() + n.substring(2),
		     un = '_update' + n[1].toUpperCase() + n.substring(2)) {
			if (s[n] !== undefined || s[cn] !== undefined || s[un] !== undefined) return;
			s[n] = i;
			s[cn] = c; // can be null
            if (typeof i === 'number') {
				s[un] = function (s, k, p, n, cn) {
							return function () {
								_D('>' + s.__name__ + '.' + un + '()');
								s[n] = settingsParseInt(s._settings, k, p.min, p.max, s[n]);
								if (s[cn]) Lang.bind(s, s[cn])();
								_D('<');
							};
						} (s, k, p, n, cn);
            }
            else if (typeof i === 'boolean') {
                s[un] = function (s, k, n, cn) {
                            return function () {
								_D('>' + s.__name__ + '.' + un + '()');
                                s[n] = settingsGetBoolean(s._settings, k, s[n]);
                                if (s[cn]) Lang.bind(s, s[cn])();
								_D('<');
                            }
                        } (s, k, n, cn);
            }
			if (s[un]) {
				s[un]();
                s._signals.connectNoId({	emitter: s._settings, signal: 'changed::' + k,
                                            callback: s[un], scope: s });
			}
		} // let (cn)
	} // let (n)
}

/* function opacity100to255(opacity)
 */
function opacity100to255(opacity) {
	return Math.round(opacity * 2.55);
}

/* function setBox: sets x1, y1, x2, y2 of box
 */
function setBox(box, x1, y1, x2, y2) {
    box.x1 = x1;
    box.y1 = y1;
    box.x2 = x2;
    box.y2 = y2;
}

/* function zip: zips two arrays into one array of pairs
 */
function zip(as, bs, l) {
	l = l || Math.min(as.length, bs.length);
	let (abs = []) {
		for (let i = 0; i < l; ++i) abs.push( [ as[i], bs[i] ] );
		return abs;
	}
}

/* function unzip: unzips array of pairs into two arrays
 */
function unzip(abs) {
	let(as = [], bs = []) {
		abs.forEach(function (ab) { as.push(ab[0]); bs.push(ab[1]); });
		return [ as, bs ];
	}
}

/* function stringRepeat(s, n): returns the string s repeated n times
 */
function stringRepeat(s, n) {
	if (!n || isNaN(n = parseInt(n)) || n <= 0) return '';
	let (sn = '') {
		while (n) {
			if (n & 1) sn += s;
			n >>= 1;
			s += s;
		}
		return sn;
	}
}
