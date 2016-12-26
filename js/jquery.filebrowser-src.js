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
    'use strict';
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
            rename_delay: 300,
            dbclick_delay: 2000,
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
    var drag;
    function is(is_value) {
        return function(name) {
            return is_value == name;
        };
    }
    function all_parents_fun(fun, element) {
        var $element = $(element);
        return $element.parents().add('html,body').map(function() {
            return $(this)[fun]();
        }).get().reduce(function(sum, prop) {
            return sum + prop;
        });
    }
    function same_root(src, dest) {
        return src === dest || dest.match(new RegExp('^' + $.browse.escape_regex(src)));
    }
    $.fn.browse = function(options) {
        var settings = $.extend({}, $.browse.defaults, options);
        function mousemove(e) {
            if (selection) {
                var offset = $ul.offset();
                x2 = e.clientX - offset.left;
                y2 = e.clientY - offset.top;
                $selection.show();
                draw_selection();
                was_selecting = true;
                var $li = $content.find('li');
                if (!e.ctrlKey) {
                    $li.removeClass('selected');
                    selected[settings.name] = [];
                }
                var selection_rect = $selection[0].getBoundingClientRect();
                var $selected = $li.filter(function() {
                    var rect = this.getBoundingClientRect();
                    return rect.top + rect.height > selection_rect.top &&
                        rect.left + rect.width > selection_rect.left &&
                        rect.bottom - rect.height < selection_rect.bottom &&
                        rect.right - rect.width < selection_rect.right;
                });
                $selected.addClass('selected').each(function() {
                    selected[settings.name].push(self.join(path, $(this).text()));
                });
            }
        }
        function mouseup(e) {
            selection = false;
            $selection.hide();
            self.removeClass('no-select');
        }
        function draw_selection(e) {
            var top = all_parents_fun('scrollTop', $content);
            var x3 = Math.max(Math.min(x1, x2), 0);
            var y3 = Math.max(Math.min(y1, y2), -top);
            var x4 = Math.max(x1, x2);
            var y4 = Math.max(y1, y2);
            var width = $content.prop('clientWidth');
            var height = $content.height() + $content.scrollTop() - 2;
            if (x4 > width) {
                x4 = width;
            }
            if (y4 > height) {
                y4 = height;
            }
            $selection.css({
                left: x3,
                top: y3 + top,
                width: x4 - x3,
                height: y4 - y3
            });
        }
        function keydown(e) {
            if (self.hasClass('selected') && !rename) {
                var current_item;
                var $active = $content.find('.active');
                if (e.ctrlKey) {
                    if (e.which == 67) { // CTRL+C
                        self.copy();
                    } else if (e.which == 88) { // CTRL+X
                        self.cut();
                    } else if (e.which == 86) { // CTRL+V
                        self.paste(cut);
                    }
                }
                if (e.which == 32) { // SPACE
                    var e = jQuery.Event("click");
                    e.ctrlKey = true;
                    e.target = $active[0];
                    $active.trigger(e);
                    return false;
                } else if (e.which == 8) { // BACKSPACE
                    self.back();
                } else {
                    if (e.which == 13 && $active.length) {
                        click_time = (new Date()).getTime();
                        $active.dblclick();
                    } else {
                        if (e.which >= 37 && e.which <= 40) {
                            if (!e.ctrlKey) {
                                $content.find('li').removeClass('selected');
                            }
                            if (!$active.length) {
                                $active = $content.find('li:eq(0)').addClass('active');
                            } else {
                                var $li = $content.find('li');
                                var browse_width = $content.prop('clientWidth');
                                var length = $li.length;
                                var width = $content.find('li:eq(0)').outerWidth(true);
                                var each_row = Math.floor(browse_width/width);
                                current_item = $active.index();
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
                                $li.eq(current_item).addClass('active').siblings().removeClass('active');
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
        function refresh_same() {
            $('.'+cls).each(function() {
                var self = $(this).browse();
                if (self.path() == path && self.name() == settings.name) {
                    self.refresh();
                }
            });
        }
        function rename_textarea() {
            var $textarea = $(this);
            var old_name = $textarea.parent().find('span').text();
            var new_name = $textarea.val();
            if (new_name != old_name) {
                settings.rename(self.join(path, old_name),
                                self.join(path, new_name));
                refresh_same();
            }
        }
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
            var click_time;
            var rename = false;
            var num_clicks = 0;
            var $toolbar = $('<div class="toolbar"/>').appendTo(self);
            var $adress_bar = $('<div class="adress-bar"></div>').appendTo($toolbar);
            $('<button>Home</button>').addClass('home').appendTo($adress_bar);
            var $tools = $('<ul></ul>').appendTo($toolbar);
            if (settings.labels) {
                $tools.addClass('labels');
            }
            var $adress = $('<input />').appendTo($adress_bar);
            var toolbar = $.browse.strings.toolbar;
            Object.keys(toolbar).forEach(function(name) {
                $('<li/>').text(toolbar[name]).addClass(name).appendTo($tools);
            });
            var $content = $('<ul/>').wrap('<div/>').parent().addClass('content').appendTo(self);
            var $ul = $content.find('ul');
            var x1 = 0, y1 = 0, x2 = 0, y2 = 0;
            var $selection = $('<div/>').addClass('selection').hide().appendTo($content);
            var selection = false;
            var was_selecting = false;
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
            $content.on('dblclick.browse', 'li', function(e) {
                var $this = $(this);
                var name = $this.find('span').text();
                var filename = self.join(path, name);
                var time = ((new Date()).getTime() - click_time);
                if (time < settings.rename_delay && time < settings.dbclick_delay) {
                    if ($this.hasClass('directory')) {
                        $this.removeClass('selected');
                        self.show(filename);
                    } else if ($this.hasClass('file')) {
                        settings.open(filename);
                    }
                }
            }).on('click.browse', 'li', function(e) {
                if (!selection) {
                    var $target = $(e.target);
                    var $this = $(this);
                    var name = $this.find('span').text();
                    var filename = self.join(path, name);
                    if ($target.is('span')) {
                        if (num_clicks++ % 2  === 0) {
                            click_time = (new Date()).getTime();
                        } else {
                            var time = ((new Date()).getTime() - click_time);
                            if (time > settings.rename_delay && time < settings.dbclick_delay) {
                                $('<textarea>'+name+'</textarea>').appendTo($this).focus().select();
                                $this.addClass('rename');
                                rename = true;
                                return false;
                            }
                        }
                    } else {
                        click_time = (new Date()).getTime();
                    }
                    if (!e.ctrlKey) {
                        $this.siblings().removeClass('selected');
                    }
                    if (!$target.is('textarea')) {
                        $content.find('.active').removeClass('active');
                        $this.toggleClass('selected').addClass('active');
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
                    }
                }
            }).on('keypress', 'textarea', function(e) {
                if (e.which == 13) { // ENTER
                    rename_textarea.call(this);
                } else if (e.which == 27) { // ESC
                    var $this = $(this);
                    $this.parent().removeClass('rename');
                    $this.remove();
                }
                if ([13, 27].indexOf(e.which) != -1) {
                    rename = false;
                    return false;
                }
            });
            self.on('click.browse', function(e) {
                $('.' + cls).removeClass('selected');
                self.addClass('selected');
                var $target = $(e.target);
                if (!was_selecting) {
                    if (!e.ctrlKey && !$target.is('.content li') &&
                        !$target.closest('.toolbar').length) {
                        $content.find('li').removeClass('selected');
                        selected[settings.name] = [];
                    }
                }
                if (!$target.is('textarea')) {
                    $content.find('li.rename').removeClass('rename')
                        .find('textarea').each(rename_textarea).remove();
                    rename = false;
                }
            });
            self.on('dragover.browse', '.content', function(e) {
                return false;
            }).on('dragstart', '.content li', function(e) {
                e.originalEvent.dataTransfer.setData('text', 'anything');
                var $this = $(this);
                var name = $this.text();
                drag = {
                    name: name,
                    node: $this,
                    path: path,
                    context: self
                };
                drag.selection = $this.hasClass('selected');
            });
            $content.on('drop.browse', function(e) {
                var $target = $(e.target);
                if (self.name() !== drag.context.name()) {
                    var msg = "You can't drag across different filesystems";
                    throw new Error(msg);
                }
                var new_path;
                if ($target.is('.directory')) {
                    new_path = self.join(path, $target.text());
                } else {
                    new_path = path;
                }
                if (drag.selection) {
                    selected[settings.name].forEach(function(src) {
                        var dest = self.join(new_path, self.split(src).pop());
                        if (!same_root(src, dest)) {
                            self._rename(src, dest);
                        }
                    });
                    refresh_same();
                } else {
                    var src = self.join(drag.path, drag.name);
                    var dest = self.join(new_path, drag.name);
                    if (!same_root(src, dest)) {
                        self._rename(src, dest);
                        refresh_same();
                    }
                }
                return false;
            }).on('mousedown.browse', function(e) {
                var $target = $(e.target);
                if (!$target.is('li') && !$target.is('span')) {
                    selection = true;
                    was_selecting = false;
                    self.addClass('no-select');
                    var offset = $ul.offset();
                    x1 = e.clientX - offset.left;
                    y1 = e.clientY - offset.top;
                }
            });
            $(document).on('click', click)
                .on('keydown', keydown)
                .on('mousemove', mousemove)
                .on('mouseup', mouseup);
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
                    if (paths.length > 1) {
                        paths.pop();
                        self.show(paths[paths.length-1], {push: false});
                    }
                    return self;
                },
                destroy: function() {
                    self.off('.browse');
                    $(document).off('click', click).off('keydown', keydown);
                    $adress_bar.remove();
                    $content.remove();
                },
                _rename: function(src, dest) {
                    if (!same_root(src, dest)) {
                        settings.rename(src, dest);
                    }
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
                            if (!same_root(src, dest)) {
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
                            refresh_same();
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
                    var defaults = {callback: $.noop, push: true, force: false};
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
                                $ul.empty();
                                current_content.dirs.forEach(function(dir) {
                                    var cls = settings.item_class(new_path, dir);
                                    var $li = $('<li class="directory"><span>' + dir + '</span></li>').
                                        appendTo($ul).attr('draggable', true);
                                    if (cls) {
                                        $li.addClass(cls);
                                    }
                                });
                                current_content.files.forEach(function(file) {
                                    var $li = $('<li class="file"><span>' + file + '</span></li>').
                                        appendTo($ul).attr('draggable', true);
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
