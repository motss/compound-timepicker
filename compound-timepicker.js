/**
 * CONSTANTS needed for rendering clock.
 */
var HOUR_OUTER_RADIUS = 66,
		HOUR_INNER_RADIUS = 32,
		MINUTE_OUTER_RADIUS = 100,
		MINUTE_INNER_RADIUS = 66,
		CENTER_OF_CIRCLE_X = 100,
		CENTER_OF_CIRCLE_Y = 100,
		STARTING_POS_OF_FIRST_NUMBER_X = 100,
		STARTING_POS_OF_FIRST_NUMBER_Y = 17,
		MINUTE_CIRCLE_X = 100,
		MINUTE_CIRCLE_Y = 17,
		HOUR_CIRCLE_X = 100,
		HOUR_CIRCLE_Y = 51,
		THETA_BETWEEN_HOURS = 30;

Polymer({

	is: 'compound-timepicker',

	properties: {
		/**
		 * Describes the author of the element, but is really just an excuse to
		 * show off JSDoc annotations.
		 *
		 * @type {{name: string, image: string}}
		 */

		/**
		 * 12/ 24 hours time format. It can be either 12 or 24.
		 */
		timeFormat: {
			type: Number,
			value: 12
		},
		/**
		 * Clock hours, any number between 0 and 23.
		 */
		hours: {
			type: Number,
			value: function() {
				return new Date().getHours();
			}
		},
		/**
		 * Clock minutes, any number between 0 and 59.
		 */
		minutes: {
			type: Number,
			value: function() {
				return new Date().getMinutes();
			}
		},
		/**
		 * Clock step, any number between 1 and 60.
		 * Default is 1 which means that each minute is selectable.
		 */
		step: {
			type: Number,
			value: 1
		},
		/**
		 * Returns selected time.
		 */
		time : {
			type: String,
			notify: true
		},
		// multiple step by 6 for minute hand tracking.
		_dragStep: {
			type: Number,
			computed: '_dragStepAngleify(step)'
		},
		// Set true to enable tracking.
		_tracking: {
			type: Boolean,
			value: false
		},
		// Set true if touchstart/ mousedown.
		_down: {
			type: Boolean,
			value: false
		},
		// Stores selected ring's ID from touch or mouse.
		_startRing: String,
		// Stores last value of touch/ mouse position when _tracking sets true.
		_lastTrackingPos: {
			type: Object,
			value: function () {
				return {};
			}
		},
		// Previously styled clock number when selected.
		_textStyled: {
			type: Number,
			value: 0
		},
		// Being used to display selected hours.
		_hours: {
			type: String,
			computed: '_textify(hours, _isHours)'
		},
		// Being used to display selected minutes.
		_minutes: {
			type: String,
			computed: '_textify(minutes)'
		},
		// Sets true for day else it's night.
		_dayNight: {
			type: Boolean,
			value: function() {
				return new Date().getHours() < 12;
			}
		},
		// hours check flag
		_isHours: {
			type: Boolean,
			value: true
		},
		// clock numbers ready check flag
		_hasClockNumbersReady: {
			type: Boolean,
			value: false
		},

		_selectedTimeConfirmed: {
			type: Boolean,
			value: false
		},

	},

	// init clock whenever [hours, minutes, _dragStep] encounters value change.
	observers: [
		'_initClock(hours, minutes, _dragStep)',
		'_validateHours(hours)',
		'_validateMinutes(minutes)',
		'_validateStep(step)'
	],

	// Element Lifecycle

	ready: function() {
		// generate all clock numbers on the clock face.
		this._clockNumberify();
		// init clock with current time by adjusting angle of all clock hands.
		this._initClock(this.hours, this.minutes, this._dragStep);
		// set initial time just in case no time is beng selected.
		this.set('time', this._selectedTime(this._hours, this._minutes,
			this._dayNight, this.timeFormat));
	},

	attached: function() {
		// `attached` fires once the element and its parents have been inserted
		// into a document.
		//
		// This is a good place to perform any work related to your element's
		// visual state or active behavior (measuring sizes, beginning animations,
		// loading resources, etc).
		var _content = this.getEffectiveChildren();
		var _paperButtons = Polymer.dom(_content[0]).querySelectorAll('paper-button');
		if (_content[0] && _paperButtons.length > 0) {
			for (var i = 0; i < _paperButtons.length; i++) {
				if (_paperButtons[i].hasAttribute('dialog-confirm')) {
					_paperButtons[i].addEventListener('tap', this._confirmSelectedTime.bind(this));
					_paperButtons[i].addEventListener('transitionend', this.updateBindTime.bind(this));
				}
			}
		}
	},

	detached: function() {
		// The analog to `attached`, `detached` fires when the element has been
		// removed from a document.
		//
		// Use this to clean up anything you did in `attached`.
	},

	// Element Behavior

	// Populate clock numbers.
	_clockNumberify: function() {
		var _x = STARTING_POS_OF_FIRST_NUMBER_X, // 100
				_y = STARTING_POS_OF_FIRST_NUMBER_Y, // 17
				_cx = CENTER_OF_CIRCLE_X, // 100
				_cy = CENTER_OF_CIRCLE_Y, // 100
				_theta = THETA_BETWEEN_HOURS; // 30

		for(var i = 0; i < 12; i++) {
			var _i = i == 0 ? 12: i,
					__theta = _theta * i,
					_temp = document.createElementNS('http://www.w3.org/2000/svg', 'text'),
					__xy = this._textNumberClockwisify(__theta, _y, _x, _cy, _cx);
			this.$.numbers.appendChild(this._textNumberify(_temp, _i, __xy.x, __xy.y));
		}
		this.set('_hasClockNumbersReady', true);
	},

	// Convert clock number into text.
	_textNumberify: function(_svg, _number, _x, _y) {
		var _text = _svg;
		_text.textContent = _number.toString();
		_text.setAttribute('x', _x);
		_text.setAttribute('y', _y);
		_text.classList.add('number');

		// if (!Polymer.Settings.useNativeShadow) {
			_text.classList.add('style-scope');
			_text.classList.add('compound-timepicker');
		// }

		return _text;
	},

	// Return rotated params for each clock text.
	_textNumberClockwisify: function(_theta, _y, _x, _cy, _cx) {
		var rotXY = {}, __theta;

		function toRad(_theta) {
			return _theta / 180 * Math.PI;
		}

		function sin(_theta, _xy, _cxy) {
			return Math.sin(_theta) * (_xy - _cxy);
		}

		function cos(_theta, _xy, _cxy) {
			return Math.cos(_theta) * (_xy - _cxy);
		}

		function rotatedX(_theta, _x, _y, _cx, cy) {
			return (cos(_theta, _x, _cx) - sin(_theta, _y, _cy)) + _cx;
		}

		function rotatedY(_theta, _x, _y, _cx, _cy) {
			return (cos(_theta, _y, _cy) + sin(_theta, _x, _cx)) + _cy;
		}

		__theta = toRad(_theta);
		rotXY.x = rotatedX(__theta, _x, _y, _cx, _cy).toFixed(1);
		rotXY.y = rotatedY(__theta, _x, _y, _cx, _cy).toFixed(1);

		return rotXY;
	},

	// Rotate minute/ hand clock hand during tracking.
	_rotatify: function(_angle) {
		this.transform.baseVal.getItem(0).setRotate(_angle, 100, 100);
	},

	// Initialize the clock with predefined config.
	_initClock: function(_hr, _min, _dragStep) {
		/**
		 * - init clock when and only when there are clock numbers.
		 * - init clock won't trigger to mouse/ touch.
		 * - problem (1510280120) when minutes was being set on-the-fly.
		 * - problem (1510280159) when hours changes with mouse/ touch.
		 */
		if (this._hasClockNumbersReady && !this._down) {
			var _h = (_hr%12) * 30,
					_m = (_min%60) * 6,
					_m2 = _m%30 === 0;

			// style selected minute at start.
			if (_m2) {
				// clear previously styled clock number.
				// problem 1510290439: caused by setting attributes imperatively.
				if (this._textStyled) {
					this.$.numbers.childNodes[this._textStyled].classList.remove('text-selected');
					this.$.minute.classList.remove('number-selected');
				}

				var _child = _m/30;
				this.set('_textStyled', _child);
				this.$.numbers.childNodes[_child].classList.add('text-selected');
				this.$.minute.classList.add('number-selected');
			}else {
				// to tacle problem 1510280120: remove all selected class.
				this.$.numbers.childNodes[this._textStyled].classList.remove('text-selected');
				this.$.minute.classList.remove('number-selected');
			}

			// hours will determine _dayNight and here update the class.
			this._dayNight ? this.$.ampm.classList.remove('night-day') :
				this.$.ampm.classList.add('night-day')

			// rotate whatever needs to be rotated.
			this._rotatify.call(this.$.hourGroup, _h);
			this._rotatify.call(this.$.minuteGroup, _m);
		}
	},

	// Update tracking position and rotate clock hand.
	_updateTracking: function() {
		if (!this._tracking) {
			requestAnimationFrame(this._draggingClockHand.bind(this, this._lastTrackingPos));
			this.set('_tracking', true);
		}
	},

	// What need to be done for touchstart/ mousedown.
	_selectHand: function(ev) {
		var _id = ev.target.id, _xy = {};
		ev.preventDefault();
		/**
		 * - 400 times faster using switch compared to multi if statements.
		 * - switch case up to ~10ms.
		 * - multi if statements up to ~4000ms.
		 */
		switch (_id) {
			case 'hour':
			case 'minute':
			case 'hourRing':
			case 'minuteRing':
				this.set('_startRing', _id);
				_xy.y = ev.detail.y;
				_xy.x = ev.detail.x;
				this._lastTrackingPos = _xy;
				this.set('_down', true);
				this._updateTracking();
				break;
			default:
				// console.log('not-inside-ring');
		}
	},

	// What need to be done for touchmove/ mousemove.
	_dragHand: function(ev) {
		switch (ev.detail.state) {
			case 'start':
				if (!this._down) {
					this.set('_down', true);
				}
				break;
			case 'track':
				var _xy = {};
				// keep updating last tracking position before rAF.
				_xy.y = ev.detail.y; _xy.x = ev.detail.x;
				this._lastTrackingPos = _xy;

				this._updateTracking();
				break;
			case 'end':
				break;
		}
	},

	// Update time and clear things up when touchend/ mouseup.
	_releaseHand: function(ev) {
		cancelAnimationFrame(this._updateTracking);
		this.set('_startRing', null);
		this.set('_down', false);
		// once release touch/ mouse, fire output.
		// this.set('time', this._selectedTime(this._hours, this._minutes,
		//   this._dayNight, this.timeFormat));
	},

	// Update touch/ mouse tracking position and convert it to angle for rotation.
	_draggingClockHand: function(_xy) {
		var _translatedXY = {},
				_rotatedXY = {},
				_angle,
				_minuteRingParam = this.$.minuteRing.getBoundingClientRect(),
				_ctr = this.$.centroid.getBoundingClientRect();

		// 4 times faster after heavy optimization of codes.
		switch (this._startRing) {
			case 'hourRing':
			case 'hour':
			case 'hourHand':
			case 'hourCentroid':
				if (this._isInner(_xy, _ctr, HOUR_INNER_RADIUS) &&
						this._isOuter(_xy, _ctr, HOUR_OUTER_RADIUS)) {
					_translatedXY = this._translateToOrigin(_minuteRingParam, _xy,
						CENTER_OF_CIRCLE_Y, CENTER_OF_CIRCLE_X);
					_angle = this._angleify(_translatedXY.y, _translatedXY.x,
						THETA_BETWEEN_HOURS);
					if (_angle >= 0) {
						_rotatedXY = this._textNumberClockwisify(_angle, HOUR_CIRCLE_Y,
							HOUR_CIRCLE_X, CENTER_OF_CIRCLE_Y, CENTER_OF_CIRCLE_X);

						// rotate everything.
						this._rotatify.call(this.$.hourGroup, _angle);
						// update hours.
						this.set('hours', _angle === 0 ? 12 : _angle / 30);
					}
				}
				break;
			case 'minuteRing':
			case 'minute':
			case 'minuteHand':
			case 'minuteCentroid':
				if (this._isInner(_xy, _ctr, MINUTE_INNER_RADIUS) &&
						this._isOuter(_xy, _ctr, MINUTE_OUTER_RADIUS)) {
					_translatedXY = this._translateToOrigin(_minuteRingParam, _xy,
						CENTER_OF_CIRCLE_Y, CENTER_OF_CIRCLE_X);
					_angle = this._angleify(_translatedXY.y, _translatedXY.x, this._dragStep);

					if (_angle >= 0) {
						var _numbers = this.$.numbers,
								_minute = this.$.minute,
								_minuteCentroid = this.$.minuteCentroid,
								_minuteHand = this.$.minuteHand;
						if (_angle%30 === 0) {
							// remove previous selected clock number.
							_numbers.children[this._textStyled].classList.remove('text-selected');
							// assign new value to _textStyled.
							this.set('_textStyled', Math.floor(_angle/30));

							// add class to minute circle.
							_minute.classList.add('number-selected');
							// add class to selecte clock number.
							_numbers.children[this._textStyled].classList.add('text-selected');
						} else {
							// for everything just remove all previously added classes.
							if (_numbers.children[this._textStyled].classList.contains('text-selected') ||
									_minute.classList.contains('numberselected')) {
								_minute.classList.remove('number-selected');
								_numbers.children[this._textStyled].classList.remove('text-selected');
							}
						}

						_rotatedXY = this._textNumberClockwisify(_angle, MINUTE_CIRCLE_Y,
							MINUTE_CIRCLE_X, CENTER_OF_CIRCLE_Y, CENTER_OF_CIRCLE_X);

						// rotate everything.
						this._rotatify.call(this.$.minuteGroup, _angle);
						// update minutes.
						this.set('minutes', _angle / 6);
					}
				}
				break;
			default:
				// console.log('outside-HOUR-ring');
		}
		// release _tracking for next frame.
		this.set('_tracking', false);
	},

	// Convert passed in positions into angle.
	_angleify: function(_y, _x, _step) {
		/**
		 * Normal: Math.atan2(y, x) - angle from +ve X axis;
		 * Here: Math.atan2(x, -y) - angle from +ve Y axis;
		 */
		var _degree = Math.round(Math.atan2(_x, -_y)/Math.PI*180);

		function _factorise(_degree, _step) {
			var _factor = _degree / _step,
					_max = Math.ceil(_factor) / (1/ _step),
					_th = _max - 3,
					_min = Math.floor(_factor) / (1/ _step);

			// when clock step !== 6, reset to 0 instead of modulus by 360.
			_max = _max > 359 ? 0 : _max;
			_min = _min > 359 ? 0 : _min;

			// negate negative values.
			_th = _th < 0 ? 360 + _th : _th;

			/**
			 * - check if computed value >= threshold value.
			 * - if true, return max angle; else return min one.
			 */
			return _degree >= _th ? _max : _min;
		}

		/**
		 * - atan2 returns value from -pi to +pi;
		 * - convert the return value to value in between 0 and 2pi;
		 */
		function _convertFullPie(_degree) {
			/**
			 * - Fallback to zero instead of to the 1st value
			 * which is 1*this.step*6;
			 * - If so, zero (00 @ 360 degree) can never be selected.
			 * - To avoid this from happening, 00 must be selectable.
			 *
			 */
			return _degree <= 0? (360 + _degree): _degree;
		}

		return _factorise(_convertFullPie(_degree), _step);
	},

	// Calculate the radius based on passed in position.
	_radiusify: function(_y, _x, _cy, _cx) {
		function deltaXY(_xy, _cxy) {
			return Math.pow((_xy - _cxy), 2);
		}

		return Math.sqrt(deltaXY(_y, _cy) + deltaXY(_x, _cx));
	},

	// Check if current position is inside the inner selectable area.
	_isInner: function(_xy, _ctr, _radius) {
		return this._radiusify(_xy.y, _xy.x, _ctr.top, _ctr.left) > _radius;
	},

	// Check if current position is inside the outer seleectable area.
	_isOuter: function(_xy, _ctr, _radius) {
		return this._radiusify(_xy.y, _xy.x, _ctr.top, _ctr.left) < _radius;
	},

	// Translation needed to make everything based from origin.
	_translateToOrigin: function(_clockPos, _xy, _cy, _cx) {
		var __xy = {};

		function _translateToOriginy(_clockPos, _xy, _cy) {
			return (_xy.y - _clockPos.top) - _cy;
		}

		function _translateToOriginx(_clockPos, _xy, _cx) {
			return (_xy.x - _clockPos.left) - _cx;
		}

		__xy.y = _translateToOriginy(_clockPos, _xy, _cy);
		__xy.x = _translateToOriginx(_clockPos, _xy, _cx);

		return __xy;
	},

	// Check if passed in value is valid.
	_validateStep: function(_step) {
		// Polymer seemed to have changed the way observer works.
		if (_step < 1 && _step > 60) {
			this.set('step', 1);
		}
	},

	// Check if passed in value is valid and update when needed.
	_validateHours: function(_hours) {
		// always get new hours since you don't need more than an hour to get hours.
		var _hr = new Date().getHours();
		// always make sure timeFormat is properly set.
		// timeFormat has the highest priority.
		switch (this.timeFormat) {
			case 12:
				// to ensure that valid newVal.
				if (_hours >= 0 && _hours <= 23) {
					// for first time init, set _dayNight and hours.
					if (!this._down) {
						this.set('hours', this._computeHours(_hours));
						/**
						 * due to minor race, only set _dayNight here,
						 * as long as there is change of value in newVal all will be
						 * redirected to here eventually.
						 */
						this.set('_dayNight', _hours < 12);
					}
				}else {
					// invalid hours goes here.
					this.set('hours', this._computeHours(_hr));
				}
				break;
			case 24:
				// making sure that newVal is valid.
				if (_hours >= 0 && _hours  <= 23) {
					// before clock show and no interaction from the user.
					if (!this._down) {
						this.set('_dayNight', _hours < 12);
					}
				}else {
					// invalid hours goes here.
					this.set('hours', _hr);
				}
				break;
			default:
				// if timeFormat is not properly set.
				this.set('timeFormat', 12);
				this.set('hours', this._computeHours(_hr));
				this.set('_dayNight', _hr < 12);
		}
	},

	// Check if passed in value is valid.
	_validateMinutes: function (_minutes) {
		// Polymer seemed to have changed the way observer works.
		if (_minutes < 0 && _minutes > 59) {
			this.set('minutes', new Date().getMinutes());
		}
	},

	// Convert step into angle.
	_dragStepAngleify: function(step) {
		return step * 6;
	},

	// Convert everything into string.
	_textify: function(_number, _hours) {
		// hours check flag
		return ('0' + (_hours ? this._computeHours(_number) : _number)).slice(-2);
	},

	// Update AM/ PM value.
	_toggleDayNight: function() {
		this.set('_dayNight', !this._dayNight);
	},

	// Update background SVG based on AM/ PM value.
	_switchDay: function() {
		this._dayNight ? this.$.ampm.classList.remove('night-day') :
			this.$.ampm.classList.add('night-day');
	},

	// Return selected hours and minutes.
	_selectedTime: function(_h, _m, _d, _f) {
		if (_f === 12) {
			// no leading zero in hours.
			return this.hours + ':' + _m + ' ' + (_d ? 'AM' : 'PM');
		} else if (_f === 24) {
			// convert 12- to 24- when it's night.
			if (!_d) {
				// 1pm until 11pm goes here.
				if (_h < 12) {
					return ((parseInt(_h) + 12) % 24) + ':' + _m;
				}
			}else {
				// 12 is always 00 at midnight.
				if (_h == 12) {
					return '00:' + _m;
				}
			}
			// return all daytime except 12am but not 12pm.
			return _h + ':' + _m;
		}
	},

	// Return shifted hours.
	_computeHours: function (_hours) {
		var _h = _hours % 12;
		return _h === 0 ? 12 : _h;
	},

	// Update selected time.
	_confirmSelectedTime: function() {
		if (!this._selectedTimeConfirmed) {
			this.set('_selectedTimeConfirmed', true);
		}
	},
	updateBindTime: function() {
		if (this._selectedTimeConfirmed) {
			this.set('time', this._selectedTime(this._hours, this._minutes,
				this._dayNight, this.timeFormat));
		}
	},

	// Force update selected time.
	// notifyTimeUpdate: function() {
	//   this.set('time', this._selectedTime(this._hours, this._minutes,
	//     this._dayNight, this.timeFormat));
	// }
});
