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
 * dbfinanimationequations.js
 * Custom animation equations.
 *
 */

const Params = imports.misc.params;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinConsts = Me.imports.dbfinconsts;
const dbFinUtils = Me.imports.dbfinutils;

/* In all functions below the following are the parameters:
 * 		t		current time (from 0 to d)
 *		b		initial value
 * 		c		expected change in value
 * 		d		expected duration
 * 		p		parameters (if needed)
 */

//function (t, b, c, d, p) {
//}

/* delay:	animate the given animation transition after delay
 */
function delay(transition, delay/* = 0.0*/) {
	if (!transition) return (function () {});
    delay = dbFinUtils.inRange(parseFloat(delay), 0.0, 1.0, 0.0);
	if (!isNaN(parseInt(transition))) {
        transition = dbFinConsts.arrayAnimationTransitions[
            dbFinUtils.inRange(parseInt(transition),
            0, dbFinConsts.arrayAnimationTransitions.length - 1, 0)
        ][1];
	}
	if (typeof transition == 'string') {
		if (typeof imports.tweener.equations[transition] == 'function') {
			transition = imports.tweener.equations[transition];
		}
		else if (typeof Me.imports.dbfinanimationequations[transition] == 'function') {
			transition = Me.imports.dbfinanimationequations[transition];
		}
	}
    if (typeof transition == 'function') {
        if (delay == 0.0) return transition;
        else if (delay < 1.0) return (function (t, b, c, d, p) {
			if ((t = (t - d * delay) / (1.0 - delay)) < 0) return b;
			else return transition(t, b, c, d, p);
        });
        else return (function (t, b, c, d, p) {
			if (t < d) return b;
			else return b + c; // it is assumed that all transitions come to b+c
        });
    }
    else {
        return (function () {});
    }
}

/* withParams:	animate the given animation transition with params
 */
function withParams(transition, params/* = 0.0*/) {
	if (!transition) return (function () {});
	if (!isNaN(parseInt(transition))) {
        transition = dbFinConsts.arrayAnimationTransitions[
            dbFinUtils.inRange(parseInt(transition),
            0, dbFinConsts.arrayAnimationTransitions.length - 1, 0)
        ][1];
	}
	if (typeof transition == 'string') {
		if (typeof imports.tweener.equations[transition] == 'function') {
			transition = imports.tweener.equations[transition];
		}
		else if (typeof Me.imports.dbfinanimationequations[transition] == 'function') {
			transition = Me.imports.dbfinanimationequations[transition];
		}
	}
    if (typeof transition == 'function') {
        if (!(params instanceof Object)) return transition;
        return (function (t, b, c, d, p) {
            if (!p) {
                return transition(t, b, c, d, params);
            }
            else {
                Params.parse(p, params);
                return transition(t, b, c, d, p);
            }
        });
    }
    else {
        return (function () {});
    }
}
