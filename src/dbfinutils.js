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
 * inRange(value, min, max, d)  returns value or min (if value < min) or max (if value > max) or d (if min > max)
 *
 * opacity100to255(opacity)		converts opacity 0-100 to 0-255, or returns undefined on fail
 *
 * stringColorOpacity100ToStringRGBA(color, opacity)    '#808080', 70 -> 'rgba(128, 128, 128, 0.7)'
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

const Gdk = imports.gi.Gdk;

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

/* function inRange(value, min, max, d): returns value or min (if value < min) or max (if value > max) or d (if min > max)
 */
function inRange(value, min, max, d) {
    if (value === undefined || value === null) return d;
    if (min === undefined) min = null;
    if (max === undefined) max = null;
    if (min !== null && max !== null && min > max) return d;
    if (min !== null && value < min) return min;
    if (max !== null && value > max) return max;
    return value;
}

/* function opacity100to255(opacity)
 */
function opacity100to255(opacity) {
    if (isNaN(opacity = parseInt(opacity))) return undefined;
	return Math.round(opacity * 2.55);
}

/* stringColorOpacity100ToStringRGBA(color, opacity): '#808080', 70 -> 'rgba(128, 128, 128, 0.7)'
 */
function stringColorOpacity100ToStringRGBA(color, opacity) {
    if (!color || opacity === undefined || isNaN(opacity = parseFloat(opacity))) return '';
    let (rgba = new Gdk.RGBA()) {
        rgba.parse(color);
        return rgba.to_string().replace(/rgba?(\s*\(\s*[0-9]+\s*,\s*[0-9]+\s*,\s*[0-9]+).*?(\))/, 'rgba$1, ' + opacity / 100. + '$2');
    } // let (rgba)
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
