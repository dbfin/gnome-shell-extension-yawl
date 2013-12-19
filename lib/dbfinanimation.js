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
 * dbfinanimation.js
 * Actor animation.
 *
 */

const Lang = imports.lang;

const GLib = imports.gi.GLib;

const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const dbFinArrayHash = Me.imports.dbfinarrayhash;
const dbFinConsts = Me.imports.dbfinconsts;
const dbFinTimeout = Me.imports.dbfintimeout;

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

let dbfinanimation = null;

/* function animateToState(actor, state, callback, scope, time, transition): animate actor to state
 *          Parameters:
 *              actor       the actor to animate
 *              state       the final state to animate to, e.g. { opacity: 255 }
 *              callback    the callback to call at the end of animation
 *              scope       the scope for callback
 *              time        animation time
 *              transition  can be an index in the array dbFinConsts.arrayAnimationTransitions or a string, or a function
 *              rounded     should the values be rounded
 */
function animateToState(actor, state, callback, scope, time, transition, rounded) {
    if (!actor || !state) return;
    if (!((time = parseInt(time)) > 0) || !dbfinanimation || !dbfinanimation.animate || !dbfinanimation.remove || !dbfinanimation.actors) time = 0;
    let (transitionIndex = parseInt(transition)) {
        if (!isNaN(transitionIndex)) {
            if (transitionIndex >= dbFinConsts.arrayAnimationTransitions.length) {
                transitionIndex = dbFinConsts.arrayAnimationTransitions.length - 1;
            }
            else if (transitionIndex < 0) {
                transitionIndex = 0;
            }
            transition = dbFinConsts.arrayAnimationTransitions[transitionIndex][1];
        }
    }
    transition = transition || 'linear';
	if (typeof transition == 'string') {
		if (typeof imports.tweener.equations[transition] == 'function') {
			transition = imports.tweener.equations[transition];
		}
		else if (typeof Me.imports.dbfinanimationequations[transition] == 'function') {
			transition = Me.imports.dbfinanimationequations[transition];
		}
	}
    if (typeof transition != 'function') return;
    // we do not schedule animation for actors not in stage
    if (actor.get_stage) { if (!actor.get_stage()) time = 0; }
    else if (actor.actor && actor.actor.get_stage) { if (!actor.actor.get_stage()) time = 0; }
    else if (actor.container && actor.container.get_stage) { if (!actor.container.get_stage()) time = 0; }
    if (time > 0) {
        let (timeCurrent = Math.ceil(GLib.get_monotonic_time() / 1000),
             _state = {},
             properties = dbfinanimation.actors.get(actor)
                          || new dbFinArrayHash.dbFinArrayHash()) {
            for (let p in state) { // animate only those that are already defined and different
                p = '' + p;
                if (actor[p] !== undefined) {
                    dbfinanimation.remove(actor, p);
                    // check if it is already being animated to the same value
                    if (actor[p] !== state[p]) {
                        _state[p] = state[p];
                        let (st = properties && properties.get(p)) {
                            if (st  && st.state === state[p]
                                    && st.time > timeCurrent
                                    && st.time < timeCurrent + time) {
                                time = st.time - timeCurrent;
                            }
                        } // let (st)
                    } // if (actor[p] !== state[p])
                    else if (properties) {
                        properties.set(p, { state: state[p], time: timeCurrent });
                    } // if (actor[p] !== state[p]) else
                } // if (actor[p] !== undefined)
            } // for (let p)
            if (Object.keys(_state).length) { // anything to animate?
                if (properties) {
                    for (let p in _state) {
                        properties.set(p, { state: state[p], time: timeCurrent + time });
                    }
                }
                _state.time = time / 1000.;
                _state.transition = transition;
                if (callback) _state.onComplete = scope ? Lang.bind(scope, callback) : callback;
                if (rounded) _state.rounded = true;
                dbfinanimation.animate(actor, _state);
            }
            else if (callback) {
                if (scope) Lang.bind(scope, callback)();
                else callback();
            }
            if (properties) dbfinanimation.actors.set(actor, properties);
        } // let (timeCurrent, _state, properties)
    } // if (time > 0)
    else {
        let (timeCurrent = Math.ceil(GLib.get_monotonic_time() / 1000),
             properties = dbfinanimation && dbfinanimation.actors
                          && (dbfinanimation.actors.get(actor)
                              || new dbFinArrayHash.dbFinArrayHash())) {
            for (let p in state) { // animate only those that are already defined and different
                p = '' + p;
                if (actor[p] !== undefined) {
                    if (dbfinanimation && dbfinanimation.remove) dbfinanimation.remove(actor, p);
                    if (actor[p] !== state[p]) {
                        actor[p] = state[p];
                    }
                    if (properties) properties.set(p, { state: state[p], time: timeCurrent });
                } // if (actor[p] !== undefined)
            } // for (let p)
            if (callback) {
                if (scope) Lang.bind(scope, callback)();
                else callback();
            }
            if (properties) dbfinanimation.actors.set(actor, properties);
        } // let (timeCurrent, properties)
    } // if (time > 0) else
}

const dbFinAnimation = new Lang.Class({
    Name: 'dbFin.Animation',

    // engine: a string or an object { engine:, ... } representing an engine
    _init: function(engine) {
        this.engine = 'tweener';
        this.engine = engine;
        this.engineStart();
        dbfinanimation = this;
    },

    destroy: function() {
        dbfinanimation = null;
        this.engineStop();
        this.engineDestroy();
    },

    engineStart: function() {
        if (!this.actors) {
            this.actors = new dbFinArrayHash.dbFinArrayHash();
        }
    },

    engineStop: function() {
        if (this.actors) {
            this.actors.destroy();
            this.actors = null;
        }
    },

    engineDestroy: function() {
        if (!this._engine) {
            return;
        }
        if (typeof this[this._engine + 'Destroy'] == 'function') {
            this[this._engine + 'Destroy'].call(this);
        }
        this.remove = function() {};
        this.animate = function() {};
        this._engine = null;
    },

    get engine() { return this._engine; },
    set engine(engine) {
        if (engine === null) {
            this.engineDestroy();
            return;
        }
        if (typeof engine == 'string') engine = { engine: engine };
        else if (typeof engine != 'object') return;
        if (!engine.engine || typeof this[engine.engine + ''] != 'function'
                           || typeof this[engine.engine + 'Remove'] != 'function') return;
        this.engineDestroy();
        this.animate = Lang.bind(this, this[this._engine = engine.engine + '']);
        this.remove = Lang.bind(this, this[this._engine + 'Remove']);
        if (typeof this[this._engine + 'Init'] == 'function') {
            this[this._engine + 'Init'].call(this, engine);
        }
    },

    // animation engines

    // tweener
    tweener: function(actor, state) {
        Tweener.addTween(actor, state);
    },

    tweenerRemove: function(actor, property) {
        Tweener.removeTweens(actor, property);
    },

    // timeout
    timeoutInit: function(engine) {
        engine = engine || {};
        if (!isNaN(engine.fps = parseInt(engine.fps)) && engine.fps > 0) {
            this._fps = engine.fps;
        }
        else {
            this._fps = 33;
        }
        this._tpf = Math.round(1000 / this._fps);
        this._actors = new dbFinArrayHash.dbFinArrayHash();
        this._propertiesCount = 0;
        this._callbacks = [];
        this._timeout = new dbFinTimeout.dbFinTimeout();
        this._lock = 0;
    },

    timeoutDestroy: function() {
        this._timeoutFinalize();
        if (this._timeout) {
            this._timeout.destroy();
            this._timeout = null;
        }
        if (this._actors) {
            this._actors.destroy();
            this._actors = null;
        }
    },

    _timeoutFinalize: function() {
        if (!this._actors || !this._callbacks || !this._timeout) {
            log('Warning: dbFinAnimation._timeoutFinalize: ' + (!this._actors ? 'this._actors == null' : !this._callbacks ? 'this._callbacks == null' : 'this._timeout == null'));
            return;
        }
        this._lock++;
        this._timeout.remove('timeout');
        for (let actorIndex = 0; actorIndex < this._actors.length; ++actorIndex) {
            let (actor = this._actors._keys[actorIndex],
                 properties = this._actors._values[actorIndex]) {
                if (actor && properties) {
                    for (let j = 0; j < properties.length; ++j) {
                        let (st = properties._values[j]) {
                            if (!st || !st.time) continue; // removed property
                            st.time = 0; // just in case
                            actor[properties._keys[j]] = st.end;
                            let (callback = st.callbackIndex !== undefined
                                            && this._callbacks[st.callbackIndex]) {
                                if (callback && callback.count) {
                                    --callback.count;
                                    if (!callback.count) (callback.callback)();
                                }
                            }
                            //--this._propertiesCount; // not needed as we zero it below
                        } // let (st)
                    } // for (let j)
                    properties.destroy();
                } // if (actor && properties)
            } // let (actor, properties)
        } // for (let actorIndex)
        this._actors.removeAll();
        this._callbacks = [];
        this._propertiesCount = 0;
        this._lock--;
    },

    _timeoutDo: function() {
        if (this._lock || !this._timeout) {
            return true;
        }
        let (time = Math.ceil(GLib.get_monotonic_time() / 1000)) {
            let (lengthA = this._actors.length,
                 keysA = this._actors._keys,
                 valuesA = this._actors._values,
                 tpf = this._tpf) {
                for (let actorIndex = 0; actorIndex < lengthA; ++actorIndex) {
                    let (actor = keysA[actorIndex],
                         properties = valuesA[actorIndex]) {
                        let (lengthP = actor && properties && properties.length) {
                            if (lengthP) {
                                let (keysP = properties._keys,
                                     valuesP = properties._values) {
                                    for (let j = 0; j < lengthP; ++j) {
                                        let (st = valuesP[j]) {
                                            if (!st || !st.time) continue; // removed property
                                            let (p = keysP[j],
                                                 timeFrame = time - st.time) {
                                                if (timeFrame < st.duration) {
                                                    let (value = st.transition(
                                                                    timeFrame,
                                                                    st.begin,
                                                                    st.change,
                                                                    st.duration
                                                                )) {
                                                        actor[p] = st.rounded ? Math.round(value)
                                                                              : value;
                                                    }
                                                } // if (timeLeft > 0)
                                                else {
                                                    st.time = 0; // remove property
                                                    actor[p] = st.end; // force final value
                                                    // call callback if needed
                                                    let (callback = st.callbackIndex !== undefined
                                                                    && this._callbacks[st.callbackIndex]) {
                                                        if (callback && callback.count) {
                                                            --callback.count;
                                                            if (!callback.count) (callback.callback)();
                                                        }
                                                    }
                                                    --this._propertiesCount;
                                                } // if (timeLeft > 0) else
                                            } // let (p, timeLeft)
                                        } // let (st)
                                    } // for (let j)
                                } // let (keysP, valuesP)
                            } // if (lengthP)
                        } // let (lengthP)
                    } // let (actor, properties)
                } // for (let actorIndex)

                if (this._propertiesCount) {
                    return true;
                }

                this._timeout.remove('timeout');
                for (let actorIndex = 0; actorIndex < lengthA; ++actorIndex) {
                    let (properties = valuesA[actorIndex]) {
                        if (properties) properties.destroy();
                    }
                }
            } // let (lengthA, keysA, valuesA, tpf)
        } // let (time)
        this._actors.removeAll();
        this._callbacks = [];
        return false;
    },

    timeout: function(actor, state) {
        if (!this._actors || !this._callbacks || !this._timeout) {
            log('Warning: dbFinAnimation.timeout: ' + (!this._actors ? 'this._actors == null' : !this._callbacks ? 'this._callbacks == null' : 'this._timeout == null'));
            return;
        }
        this._lock++;
        let (properties = this._actors.get(actor),
             newActor = false,
             callback = state.onComplete ? { callback: state.onComplete } : null,
             callbackIndex = undefined,
             timeCurrent = Math.ceil(GLib.get_monotonic_time() / 1000),
             count = 0) {
            if (!properties) {
                newActor = true;
                properties = new dbFinArrayHash.dbFinArrayHash();
            }
            if (callback) {
                callbackIndex = this._callbacks.length;
            }
            for (let p in state) {
                if (p == 'time' || p == 'transition' || p == 'onComplete' || p == 'rounded') continue;
                ++count;
                ++this._propertiesCount;
                properties.set(p, { begin: actor[p],
                                    change: state[p] - actor[p],
                                    end: state[p],
                                    time: timeCurrent,
                                    duration: Math.ceil(state.time * 1000),
                                    transition: state.transition,
                                    rounded: !!state.rounded,
                                    callbackIndex: callbackIndex });
            }
            if (count > 0) {
                if (newActor) {
                    this._actors._keys.push(actor);
                    this._actors._values.push(properties);
                    this._actors.length++;
                }
                if (callback) {
                    callback.count = count;
                    this._callbacks.push(callback);
                }
            }
        }
        this._timeout.add('timeout', this._tpf, this._timeoutDo, this, false, false, true);
        this._lock--;
    },

    timeoutRemove: function(actor, property) {
        if (!this._actors || !this._callbacks || !this._timeout) {
            log('Warning: dbFinAnimation.timeoutRemove: ' + (!this._actors ? 'this._actors == null' : !this._callbacks ? 'this._callbacks == null' : 'this._timeout == null'));
            return;
        }
        this._lock++;
        let (actorIndex = this._actors._keys.indexOf(actor)) {
            let (properties = actorIndex != -1 && this._actors._values[actorIndex]) {
                if (properties) {
                    let (j = properties._keys.indexOf(property)) {
                        let (st = j != -1 && properties._values[j]) {
                            if (st && st.time) {
                                st.time = 0;
                                if (st.callbackIndex !== undefined) {
                                    let (callback = this._callbacks[st.callbackIndex]) {
                                        if (callback && callback.count) --callback.count;
                                    }
                                }
                                --this._propertiesCount;
                            } // if (st && st.time)
                        } // let (st)
                    } // let (j)
                } // if (properties)
            } // let (properties)
        } // let (actorIndex)
        if (!this._propertiesCount) {
            this._timeout.remove('timeout');
            for (let actorIndex = 0; actorIndex < this._actors.length; ++actorIndex) {
                let (properties = this._actors._values[actorIndex]) {
                    if (properties) properties.destroy();
                }
            }
            this._actors.removeAll();
            this._callbacks = [];
        }
        this._lock--;
    }
});
