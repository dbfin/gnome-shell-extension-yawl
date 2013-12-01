include ../include.mk

dist_extension_DATA = \
	../../lib/convenience2.js \
	dbfinactivities.js \
	../../lib/dbfinanimation.js \
	../../lib/dbfinanimationequations.js \
	dbfinappbutton.js \
	../../lib/dbfinarrayhash.js \
	../../lib/dbfinclicked.js \
	dbfinclickmeter.js \
	dbfinconsts.js \
	../../lib/dbfindebug.js \
	dbfindebugview.js \
	dbfinmenubuilder.js \
	dbfinmovecenter.js \
	dbfinpanelbuttontoggle.js \
	dbfinpanelenhancements.js \
	../../lib/dbfinpopupmenu.js \
	dbfinpreview.js \
	../../lib/dbfinsettings.js \
	../../lib/dbfinsignals.js \
	../../lib/dbfinsliceractor.js \
	../../lib/dbfinslicericon.js \
	../../lib/dbfinslicerlabel.js \
	../../lib/dbfinstyle.js \
	../../lib/dbfintimeout.js \
	dbfintracker.js \
	dbfintrackerapp.js \
	dbfintrackerwindow.js \
	../../lib/dbfinutils.js \
	../../lib/dbfinutilsprefs.js \
	dbfinwindowthumbnail.js \
	dbfinyawl.js \
	dbfinyawlpanel.js \
	extension.js \
	prefs.js \
	stylesheet.css
nodist_extension_DATA = \
	changelog.txt \
	../../lib/GNUGPLv3 \
	../../lib/license.txt \
	metadata.json \
	readme.txt \
	icon.png \
	screenshot.png
images = \
	../../images/mouse-left.png \
	../../images/mouse-right.png \
	../../images/mouse-middle.png \
	../../images/icon.png \
	../../images/panel.png \
	../../images/animation.png \
	../../images/mouse.png \
	../../images/tuning.png \
	../../images/mouse-clicks-double.gif \
	../../images/mouse-clicks-single.gif \
	../../images/empty_16.png \
	../../images/thumbnail.png \
	../../images/animation_thumbnail.png \
	../../images/panel_thumbnail.png \
	../../images/debug.png \
	../../images/yawl.png \
	../../images/gplv3.png \
	../../images/thumbnail_16.png \
	../../images/icon_16.png \
	../../images/animation_engine.png

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
