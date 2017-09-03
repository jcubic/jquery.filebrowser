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

# License

Licensed under [MIT](http://opensource.org/licenses/MIT) license

Copyright (c) 2016-2017 [Jakub Jankiewicz](http://jcubic.pl/me)
