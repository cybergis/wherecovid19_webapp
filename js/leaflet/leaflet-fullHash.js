// Make the tag of initialization global variable 
// so that it can be used in leaflet.js
var initializedTag = false;
var index = 0;
// var slider = null;
const DayInMilSec = 60 * 60 * 24 * 1000;

//---------------End of Global Variables---------------

(function(window) {
	// var initializedTag = false;
	
	var HAS_HASHCHANGE = (function() {
		var doc_mode = window.documentMode;
		return ('onhashchange' in window) &&
			(doc_mode === undefined || doc_mode > 7);
	})();

	L.Hash = function(map, options) {
		this.onHashChange = L.Util.bind(this.onHashChange, this);

		if (map) {
			this.init(map, options);
		}
	};

	L.Hash.parseHash = function(hash) {
		if(hash.indexOf('#') === 0) {
			hash = hash.substr(1);
		}
		var args = hash.split("/");
		if (args.length == 5) {
			var zoom = parseInt(args[0], 10),
			lat = parseFloat(args[1]),
			lon = parseFloat(args[2]),
			layers = (args[3]).split("-"),
			dateIndex = parseInt(args[4], 10);

			if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
				return false;
			} else {
				return {
					center: new L.LatLng(lat, lon),
					zoom: zoom,
					layers: layers,
					dateIndex: dateIndex
				};
			}
		} else {
			return false;
		}
	};

	L.Hash.formatHash = function(map) {
		var center = map.getCenter(),
		    zoom = map.getZoom(),
		    precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2)),
			layers = [],
			dateIndex = index;

		var options = this.options;
		//Check active layers
		for(var key in options) {
			if (options.hasOwnProperty(key)) {
				if (map.hasLayer(options[key])) {
					layers.push(key);
				};
			};
		};

		return "#" + [zoom,
			center.lat.toFixed(precision),
			center.lng.toFixed(precision),
			layers.join("-"),
			dateIndex
		].join("/");
	},

	L.Hash.prototype = {
		map: null,
		lastHash: null,

		parseHash: L.Hash.parseHash,
		formatHash: L.Hash.formatHash,

		init: function(map, options) {
			this.map = map;
			L.Util.setOptions(this, options);

			// reset the hash
			// this.lastHash = null;
			this.lastHash = "#"+document.location.href.split('#')[1];
			// this.onHashChange();
			this.update();

			if (!this.isListening) {
				this.startListening();
			}

			initializedTag = true;
		},

		removeFrom: function(map) {
			if (this.changeTimeout) {
				clearTimeout(this.changeTimeout);
			}

			if (this.isListening) {
				this.stopListening();
			}

			this.map = null;
		},

		onMapMove: function() {
			// bail if we're moving the map (updating from a hash),
			// or if the map is not yet loaded

			if (this.movingMap || !this.map._loaded) {
				return false;
			}

			var hash = this.formatHash(this.map);
			if (this.lastHash != hash) {
				location.replace(hash);
				this.lastHash = hash;
			}
		},

		movingMap: false,
		update: function() {
			// Get the view of URL when initializing the map 
			// But change the hash according to current view after initialization 
			
			if (initializedTag == false) {
				hash = this.lastHash;
			} else {
				hash = this.formatHash(this.map);
				if (hash === this.lastHash) {
					return;
				}
			}
			var parsed = this.parseHash(hash);
			console.log(parsed);
			if (parsed) {
				this.movingMap = true;

				this.map.setView(parsed.center, parsed.zoom);
				var layers = parsed.layers,
					options = this.options,
					that = this;
					dateIndex = parsed.dateIndex;

				//Add/remove layers
				this.map.eachLayer(function(layer) {
					that.map.removeLayer(layer);
				});

				layers.forEach(function(element, index, array) {
					that.map.addLayer(options[element]);
				});

				// Set up time slider
				slider.setTime(slider.start + dateIndex*DayInMilSec); 

				this.movingMap = false;
			} else {
				this.onMapMove(this.map);
			}
		},

		// defer hash change updates every 100ms
		changeDefer: 100,
		changeTimeout: null,
		onHashChange: function() {
			// throttle calls to update() so that they only happen every
			// `changeDefer` ms
			if (!this.changeTimeout) {
				var that = this;
				this.changeTimeout = setTimeout(function() {
					that.update();
					that.changeTimeout = null;
				}, this.changeDefer);
			}
		},

		isListening: false,
		hashChangeInterval: null,
		startListening: function() {
			this.map.on("moveend layeradd layerremove mousedown", this.onMapMove, this);

			if (HAS_HASHCHANGE) {
				L.DomEvent.addListener(window, "hashchange", this.onHashChange);
			} else {
				clearInterval(this.hashChangeInterval);
				this.hashChangeInterval = setInterval(this.onHashChange, 50);
			}
			this.isListening = true;
		},

		stopListening: function() {
			this.map.off("moveend layeradd layerremove mousedown", this.onMapMove, this);

			if (HAS_HASHCHANGE) {
				L.DomEvent.removeListener(window, "hashchange", this.onHashChange);
			} else {
				clearInterval(this.hashChangeInterval);
			}
			this.isListening = false;
		},

		_keyByValue: function(obj, value) {
			for(var key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (obj[key] === value) {
						return key;
					} else { return null; };
				};
			};
		}
	};
	L.hash = function(map, options) {
		return new L.Hash(map, options);
	};
	L.Map.prototype.addHash = function() {
		this._hash = L.hash(this, this.options);
	};
	L.Map.prototype.removeHash = function() {
		this._hash.removeFrom();
	};
})(window);
