/**@license
 *
 * jQuery File Browser - directory browser jQuery plugin version {{VER}}
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
			change: $.noop,
			init: $.noop,
			item_class: $.noop,
			open: $.noop,
			rename: $.noop,
			copy: $.noop,
			name: 'default',
			error: $.noop,
			refresh_timer: 100
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
	var copy;
	var cut;
	var selected = {};
	function is(is_value) {
		return function(name) {
			return is_value == name;
		};
	}
	$.fn.browse = function(options) {
		var settings = $.extend({}, $.browse.defaults, options);
		if (this.data('browse')) {
			return this.data('browse');
		} else if (this.length > 1) {
			return this.each(function() {
                $.fn.browse.call($(this), settings);
			});
		} else {
			var cls = 'browser-widget';
			selected[settings.name] = selected[settings.name] || [];
			var self = this;
			self.addClass(cls + ' hidden');
			var path;
			var paths = [];
			var current_content;
			var $toolbar = $('<ul class="toolbar"></ul>').appendTo(self);
			if (settings.labels) {
				$toolbar.addClass('labels');
			}
			var $adress_bar = $('<div class="adress-bar"></div>').appendTo($toolbar);
			$('<button>Home</button>').addClass('home').appendTo($adress_bar);
			var $adress = $('<input />').appendTo($adress_bar);
			var toolbar = $.browse.strings.toolbar;
			Object.keys(toolbar).forEach(function(name) {
				$('<li/>').text(toolbar[name]).addClass(name).appendTo($toolbar);
			});
			var $content = $('<ul/>').addClass('content').appendTo(self);
			//$content.wrap('<div/>').parent().addClass('content');
			$toolbar.on('click.browse', 'li', function() {
				var $this = $(this);
				if (!$this.hasClass('disabled')) {
					var name = $this.text();
					self[name]();
				}
			}).on('click', '.home', function() {
				if (path != settings.root) {
					self.show(settings.root);
				}
			}).on('keypress.browse', 'input', function(e) {
				if (e.which == 13) {
					var $this = $(this);
					var path = $this.val();
					self.show(path);
				}
			});
			$content.on('dblclick.browse', 'li', function() {
				var $this = $(this);
				var filename = self.join(path, $this.text());
				if ($this.hasClass('directory')) {
					$this.removeClass('selected');
					self.show(filename);
				} else if ($this.hasClass('file')) {
					settings.open(filename);
				}
			}).on('click.browse', 'li', function(e) {
				var $this = $(this);
				if (!e.ctrlKey) {
					$this.siblings().removeClass('selected');
				}
				$this.toggleClass('selected');
				var filename = self.join(path, $this.text());
				if ($this.hasClass('selected')) {
					if (!e.ctrlKey) {
						selected[settings.name] = [];
					}
					selected[settings.name].push(filename);
				} else if (e.ctrlKey) {
					selected[settings.name] = selected[settings.name]
						.filter(is(filename));
				} else {
					selected[settings.name] = [];
				}
			})
			self.on('click.browse', function(e) {
				$('.' + cls).removeClass('selected');
				$(this).addClass('selected');
				var $target = $(e.target);
				if (!e.ctrlKey && !$target.is('.content li') &&
					!$target.closest('.toolbar').length) {
					$content.find('li').removeClass('selected');
					selected[settings.name] = [];
				}
			});
			function keydown(e) {
				if (self.hasClass('selected')) {
					if (e.ctrlKey) {
						if (e.which == 67) { // CTRL+C
							self.copy();
							console.log(selected[settings.name].slice());
						} else if (e.which == 88) { // CTRL+X
							self.cut();
						} else if (e.which == 86) { // CTRL+V
							self.paste(cut);
						}
					} else if (e.which == 8) { // BACKSPACE
						self.back();
					} else {
						var $selected = $content.find('.selected');
						if (e.which == 13 && $selected.length) {
							$selected.dblclick();
						} else {
							if (e.which >= 37 && e.which <= 40) {
								var current_item;
								var $li = $content.find('li');
								if (!$selected.length) {
									$selected = $content.find('li:eq(0)');
									current_item = 0;
								} else {
									$selected.removeClass('selected');
									var browse_width = $content.prop('clientWidth');
									var length = $li.length;
									var width = $content.find('li:eq(0)').outerWidth(true);
									var each_row = Math.floor(browse_width/width);
									current_item = $selected.index();
									if (e.which == 37) { // LEFT
										current_item--;
									} else if (e.which == 38) { // UP
										current_item = current_item-each_row;
									} else if (e.which == 39) { // RIGHT
										current_item++;
									} else if (e.which == 40) { // DOWN
										current_item = current_item+each_row;
									}
									if (current_item < 0) {
										current_item = 0;
									} else if (current_item > length-1) {
										current_item = length-1;
									}
								}
								if (e.which >= 37 && e.which <= 40) {
									var $new_selection = $li.eq(current_item).addClass('selected');
									var filename = self.join(path, $new_selection.text());
									if ($new_selection.length) {
										selected[settings.name] = [filename];
									} else {
										selected[settings.name] = [];
									}
								}
							}
						}
					}
				}
			}
			function click(e) {
				if (!$(e.target).closest('.' + cls).length) {
					$('.browser-widget').removeClass('selected');
				}
			}
			$(document).on('click', click).on('keydown', keydown);
			$.extend(self, {
				path: function() {
					return path;
				},
				name: function() {
					return settings.name;
				},
				current: function() {
					return current;
				},
				back: function() {
					paths.pop();
					self.show(paths[paths.length-1], {push: false});
					return self;
				},
				destroy: function() {
					self.off('.browse');
					$(document).off('click', click).off('keydown', keydown);
					$adress_bar.remove();
					$content.remove();
				},
				_rename: function(src, dest) {
					settings.rename(src, dest);
				},
				_copy: function(src, dest) {
					settings.copy(src, dest);
				},
				copy: function() {
					copy = {
						path: path,
						contents: selected[settings.name],
						source: self
					};
					cut = false;
				},
				cut: function() {
					self.copy();
					cut = true;
				},
				paste: function(cut) {
					function process(widget, fn) {
						copy.contents.forEach(function(src) {
							var name = widget.split(src).pop();
							var dest = widget.join(path, name);
							if (src != dest) {
								widget[fn](src, dest);
							}
						});
					}
					if (copy && copy.contents && copy.contents.length) {
						if (self.name() !== copy.source.name()) {
							throw new Error("You can't paste across different filesystems");
						} else {
							if (cut) {
								process(self, '_rename');
							} else {
								process(self, '_copy');
							}
							self.refresh();
							if (self !== copy.source) {
								copy.source.refresh();
							}
						}
					}
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
							if (!content) {
								settings.error('Invalid directory');
								self.removeClass('hidden');
							} else {
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
								$adress.val(new_path);
								settings.change.call(self);
								options.callback();
							}
						});
					}
					return self;
				},
				join: function() {
					var paths = [].slice.call(arguments);
					var path = paths.map(function(path) {
						var re = new RegExp($.browse.escape_regex(settings.separator) + '$', '');
						return path.replace(re, '');
					}).filter(Boolean).join(settings.separator);// + settings.separator;
					var re = new RegExp('^' + $.browse.escape_regex(settings.root));
					return re.test(path) ? path : settings.root + path;
				},
				split: function(filename) {
					var root = new RegExp('^' + $.browse.escape_regex(settings.root));
					var separator = new RegExp($.browse.escape_regex(settings.separator) + '$');
					filename = filename.replace(root, '').replace(separator, '');
					if (filename) {
						return filename.split(settings.separator);
					} else {
						return [];
					}
				},
				walk: function(filename, fn) {
					var path = this.split(filename);
					var result;
					while(path.length) {
						result = fn(path.shift(), !path.length);
					}
					return result;
				}
			});
			setTimeout(function() {
				var path = settings.start_directory || settings.root;
				self.show(path, {
					callback: settings.init.bind(self)
				});
			}, 0);
			self.data('browse', self);
			return self;
		}
	};
})(jQuery);