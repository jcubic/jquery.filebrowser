# jQuery File Browser version 0.8.0

jQuery File Browser is a plugin for creating OS like file browsers.

<a href="https://app.codesponsor.io/link/mm9ExaTRnnyn4TH8MFkSL6zG/jcubic/jquery.filebrowser" rel="nofollow"><img src="https://app.codesponsor.io/embed/mm9ExaTRnnyn4TH8MFkSL6zG/jcubic/jquery.filebrowser.svg" style="width: 888px; height: 68px;" alt="Sponsor" /></a>

[Demo](http://codepen.io/jcubic/pen/aBKYRR)

# installation

to install you can grab the files from the repo or install from

## bower

```
bower install jquery.filebrowser --save
```

## npm

```
npm install jquery.filebrowser --save
```

include the files:

```html
<script src="js/jquery.filebrowser.min.js"></script>
<link href="css/jquery.filebrowser.min.css" rel="stylesheet"/>
```

and you can use this code to initialize the plugin:

```javascript
$(function() {
    var browse = $('#browser').browse({
        root: '/',
        separator: '/',
        contextmenu: true,
        dir: function(path) {
            return new Promise(function(resolve, reject) {
                 if (path == '/') {
                     resolve({dirs: ['foo', 'bar'], files: []});
                 } else if (path == '/foo/') {
                     resolve({dirs: [], files: ['baz', 'quux']});
                 } else if (path == '/bar/') {
                     resolve({dirs: [], files: ['lorem', 'ipsum']});
                 } else {
                     reject(); // for cases when you type wrong path in address bar
                 }
             });
        },
        open: function(filename) {
            console.log('opening ' + filename);
        }
    });
});
```

All user functions that modify the Directory like create, remove, copy, rename can return a promise,
and the plugin will refresh the view (call dir function) when it's resolved.

more examples and usage in [examples directory](https://github.com/jcubic/jquery.filebrowser/tree/master/examples).

# Requirement

If you want context menu (enabled using contextmenu option) you'll need jQuery UI and of course you need jQuery itself.

# Options

* name - used to distinguish different filesystem for copying nad moving files (rename)
* dir - function that should return a promise that resolve to object `{files: <ARRAY>, dirs: <ARRAY>}` or return that object
* separator - path separator (a string) usualy `/` or `\` (to use `\` you need to put `'\\'`) default /
* root - root of the filesystem, it can be any path like `/home/<user>`, default `/`
* change - callback function that's called on refresh of the directory
* init - callack executed on initalization of the plugin
* item_class - function that should return addiional classes for the element (directory or file) you can use this to have different icons for C or D drive that's in root directory, see [windows example](https://github.com/jcubic/jquery.filebrowser/tree/master/examples/windows.html)
* dbclick_delay - if the time of the second click is lower then this but hight then rename_delay it's consider as action for rename a file or directory
* open - callback function executed with path of the file when you double click on the file
* rename - callback function called with old path nad new path when you rename a file or direcoty
* create - callback called with path of the new file or directory and string 'directory' or 'file' as second argument
* copy - callback executed when you copy a file using CTRL+C and CTRL+V
* upload - callback called with file object and the path when you drag and drop a file or directory to browser container, you can also drag into visible directory
* error - called when error accured like when you try to enter invalid path in address bar
* refresh_timer - timeout after fetch of the content of the file in miliseconds, used to see visible refresh when you change direcotry (you can set it to 0), default 100

# License

Licensed under [MIT](http://opensource.org/licenses/MIT) license

Copyright (c) 2016-2017 [Jakub Jankiewicz](http://jcubic.pl/me)
