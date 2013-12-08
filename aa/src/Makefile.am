include ../include.mk

dist_extension_DATA = \
	dbfinaa.js \
	../../lib/convenience2.js \
	../../lib/dbfinarrayhash.js \
	dbfinconsts.js \
	../../lib/dbfindebug.js \
	../../lib/dbfinsettings.js \
	../../lib/dbfinsignals.js \
	../../lib/dbfintimeout.js \
	../../lib/dbfinutils.js \
	../../lib/dbfinutilsprefs.js \
	extension.js \
	prefs.js \
	stylesheet.css
nodist_extension_DATA = \
	../../lib/GNUGPLv3 \
	../../lib/license.txt \
	changelog.txt \
	metadata.json \
	readme.txt \
	icon.png \
	screenshot.png
images = \
	../../images/aa.png \
	../../images/gplv3.png

imagedir = $(extensiondir)/images
dist_image_DATA = $(images)

EXTRA_DIST = metadata.json.in
CLEANFILES = metadata.json

gschemas_in = $(gschemaname).gschema.xml.in
@INTLTOOL_XML_NOMERGE_RULE@
gsettings_SCHEMAS = $(gschemas_in:.xml.in=.xml)
@GSETTINGS_RULES@
CLEANFILES += $(gschemas_in:.xml.in=.valid) $(gsettings_SCHEMAS)

SUBDIRS =
EXTRA_DIST += $(gschemas_in)

metadata.json: metadata.json.in $(top_builddir)/config.status
	$(AM_V_GEN) sed \
		-e "s|[@]UUID@|$(uuid)|" \
		-e "s|[@]EXTENSIONID@|$(EXTENSION_ID)|" \
		-e "s|[@]EXTENSIONVERSION@|$(extensionversion)|" \
		-e "s|[@]EXTENSIONURL@|$(extensionurl)|" \
		-e "s|[@]GSCHEMANAME@|$(gschemaname)|" \
		$< > $@
