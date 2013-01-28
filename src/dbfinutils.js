/* -*- mode: js2; js2-basic-offset: 4; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil -*-  */
/*
 * YAWL (Yet Another Window List) Gnome-Shell Extension
 * Copyright (C) 2013 Vadim @ dbFin <vadim@dbfin.com>
 * You should have received a copy of the License along with this program.
 *
 * dbfinutils.js
 * Common utilities.
 *
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

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
