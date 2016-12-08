/**@license
 *
 * jQuery Browse - directory browser jQuery plugin {{VER}}
 *
 * Copyright (c) 2016 Jakub Jankiewicz <http://jcubic.pl>
 * Released under the MIT license
 *
 * Date: {{DATE}}
 */
(function($, undefined) {
	$.browse = {
		defaults: {
			dir: function() {
				return {files:[], dirs: []};
			},
			root: '/',
			separator: '/',
			labels: true,
			on_change: $.noop,
			on_init: $.noop,
			item_class: $.noop,
			refresh_timer: 200
		},
		strings: {
			toolbar: {
				back: 'back',
				up: 'up',
				refresh: 'refresh'
			}
		},
		escape_regex: function(str) {
			if (typeof str == 'string') {
				var special = /([-\\\^$\[\]()+{}?*.|])/g;
				return str.replace(special, '\\$1');
			}
		}
	};
	$.fn.browse = function(options) {
		var settings = $.extend({}, $.browse.defaults, options);
		if (this.data('browse')) {
			return this.data('browse');
		} else if (this.length > 1) {
			return this.each(function() {
                $.fn.browse.call($(this), settings);
			});
		} else {
			var self = this;
			self.addClass('browse hidden');
			var path;
			var paths = [];
			var current_content;
			var $adress = $('<input class="adress-bar"/>').append
			var $toolbar = $('<ul class="toolbar"></ul>').appendTo(self);
			if (settings.labels) {
				$toolbar.addClass('labels');
			}
			var toolbar = $.browse.strings.toolbar;
			Object.keys(toolbar).forEach(function(name) {
				$('<li/>').text(toolbar[name]).addClass(name).appendTo($toolbar);
			});
			$toolbar.on('click', 'li', function() {
				var $this = $(this);
				if (!$this.hasClass('disabled')) {
					var name = $this.text();
					self[name]();
				}
			});
			var $content = $('<ul/>').appendTo(self);
			$content.on('dblclick', 'li', function() {
				var $this = $(this);
				var filename = self.join(path, $this.text());
				if ($this.hasClass('directory')) {
					self.show(filename);
				} else if ($this.hasClass('file')) {
					settings.open(filename);
				}
			});
			$.extend(self, {
				path: function() {
					return path;
				},
				current: function() {
					return current;
				},
				back: function() {
					paths.pop();
					self.show(paths[paths.length-1], {push: false});
					return self;
				},
				up: function() {
					var dirs = self.split(path);
					dirs.pop();
					self.show(self.join.apply(self, dirs));
					return self;
				},
				refresh: function() {
					$content.addClass('hidden');
					var timer = $.Deferred();
					var callback = $.Deferred();
					if (settings.refresh_timer) {
						setTimeout(timer.resolve.bind(timer), settings.refresh_timer);
					} else {
						timer.resolve();
					}
					self.show(path, {
						force: true,
						push: false,
						callback: function() {
							callback.resolve();
						}
					});
					$.when(timer, callback).then(function() {
						$content.removeClass('hidden');
					});
				},
				show: function(new_path, options) {
					var defaults = {callback: $.noop, push: true, force: false}
					options = $.extend({}, defaults, options);
					if (path != new_path || options.force) {
						self.addClass('hidden');
						if (options.push) {
							paths.push(new_path);
						}
						$toolbar.find('.up').toggleClass('disabled', new_path == settings.root);
						$toolbar.find('.back').toggleClass('disabled', paths.length == 1);
						path = new_path;
						settings.dir(path, function(content) {
							current_content = content;
							self.addClass('hidden');
							$content.empty();
							current_content.dirs.forEach(function(dir) {
								var cls = settings.item_class(new_path, dir);
								var $li = $('<li class="directory">' + dir + '</li>').
									appendTo($content);
								if (cls) {
									$li.addClass(cls);
								}
									
							});
							current_content.files.forEach(function(file) {
								var $li = $('<li class="file">' + file + '</li>').
									appendTo($content);
								if (file.match('.')) {
									$li.addClass(file.split('.').pop());
								}
								var cls = settings.item_class(new_path, file);
								if (cls) {
									$li.addClass(cls);
								}
							});
							self.removeClass('hidden');
							settings.on_change.call(self);
							options.callback();
						});
					}
					return self;
				},
				join: function() {
					var paths = [].slice.call(arguments);
					var path = paths.map(function(path) {
						var re = new RegExp($.browse.escape_regex(settings.separator) + '$', '');
						return path.replace(re, '');
					}).filter(Boolean).join(settings.separator) + settings.separator;
					var re = new RegExp('^' + $.browse.escape_regex(settings.root));
					return re.test(path) ? path : settings.root + path;
				},
				split: function(filename) {
					var re = new RegExp('^' + $.browse.escape_regex(settings.root));
					filename = filename.replace(re, '');
					if (filename) {
						return filename.split(settings.separator).slice(0, -1);
					} else {
						return [];
					}
				},
				walk: function(filename, fn) {
					var path = this.split(filename);
					var result;
					while(path.length) {
						result = fn(path.shift(), filename);
					}
					return result;
				}
			});
			setTimeout(function() {
				var path = settings.start_directory || settings.root;
				self.show(path, {
					callback: settings.on_init.bind(self)
				});
			}, 0);
			self.data('browse', self);
			return self;
		}
	};
})(jQuery);