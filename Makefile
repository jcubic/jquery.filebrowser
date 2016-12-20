VERSION=0.6.0
COMPRESS=uglifyjs
SED=sed
CP=cp
RM=rm
CAT=cat
DATE=`date -uR`


ALL: Makefile .$(VERSION) js/jquery.filebrowser-$(VERSION).js js/jquery.filebrowser.js js/jquery.filebrowser-$(VERSION).min.js js/jquery.filebrowser.min.js css/jquery.filebrowser-$(VERSION).css css/jquery.filebrowser-$(VERSION).min.css css/jquery.filebrowser.min.css css/jquery.filebrowser.css README.md bower.json package.json

.$(VERSION): Makefile
	touch .$(VERSION)

bower.json: bower.in .$(VERSION)
	$(SED) -e "s/{{VER}}/$(VERSION)/g" bower.in > bower.json

package.json: package.in .$(VERSION)
	$(SED) -e "s/{{VER}}/$(VERSION)/g" package.in > package.json

js/jquery.filebrowser-$(VERSION).js: js/jquery.filebrowser-src.js .$(VERSION)
	$(SED) -e "s/{{VER}}/$(VERSION)/g" -e "s/{{DATE}}/$(DATE)/g" js/jquery.filebrowser-src.js > js/jquery.filebrowser-$(VERSION).js

js/jquery.filebrowser.js: js/jquery.filebrowser-$(VERSION).js
	$(CP) js/jquery.filebrowser-$(VERSION).js js/jquery.filebrowser.js

js/jquery.filebrowser-$(VERSION).min.js: js/jquery.filebrowser-$(VERSION).js
	$(COMPRESS) -o js/jquery.filebrowser-$(VERSION).min.js --comments --mangle -- js/jquery.filebrowser-$(VERSION).js

js/jquery.filebrowser.min.js: js/jquery.filebrowser-$(VERSION).min.js
	$(CP) js/jquery.filebrowser-$(VERSION).min.js js/jquery.filebrowser.min.js

css/jquery.filebrowser-$(VERSION).css: css/jquery.filebrowser-src.css .$(VERSION)
	$(SED) -e "s/{{VER}}/$(VERSION)/g" -e "s/{{DATE}}/$(DATE)/g" css/jquery.filebrowser-src.css > css/jquery.filebrowser-$(VERSION).css

css/jquery.filebrowser.css: css/jquery.filebrowser-$(VERSION).css .$(VERSION)
	$(CP) css/jquery.filebrowser-$(VERSION).css css/jquery.filebrowser.css

css/jquery.filebrowser.min.css: css/jquery.filebrowser-$(VERSION).min.css
	$(CP) css/jquery.filebrowser-$(VERSION).min.css css/jquery.filebrowser.min.css

css/jquery.filebrowser-$(VERSION).min.css: css/jquery.filebrowser-$(VERSION).css
	java -jar bin/yuicompressor-2.4.8.jar css/jquery.filebrowser-$(VERSION).css -o css/jquery.filebrowser-$(VERSION).min.css
	$(SED) -i -e 's/0,100%/0%,100%/g' css/jquery.filebrowser-$(VERSION).min.css

README.md: README.in .$(VERSION)
	$(SED) -e "s/{{VER}}/$(VERSION)/g" < README.in > README.md
