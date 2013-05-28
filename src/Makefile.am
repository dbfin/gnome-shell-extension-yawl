include ../include.mk

dist_extension_DATA = \
	convenience2.js \
	dbfinanimation.js \
	dbfinanimationequations.js \
	dbfinappbutton.js \
	dbfinarrayhash.js \
	dbfinclicked.js \
	dbfinclickmeter.js \
	dbfinconsts.js \
	dbfindebug.js \
	dbfindebugview.js \
	dbfinmovecenter.js \
	dbfinpanelbuttontoggle.js \
	dbfinpanelenhancements.js \
	dbfinpreview.js \
	dbfinsettings.js \
	dbfinsignals.js \
	dbfinsliceractor.js \
	dbfinslicericon.js \
	dbfinslicerlabel.js \
	dbfinstyle.js \
	dbfintracker.js \
	dbfintrackerapp.js \
	dbfintrackerwindow.js \
	dbfinutils.js \
	dbfinutilsprefs.js \
	dbfinwindowthumbnail.js \
	dbfinyawl.js \
	dbfinyawlpanel.js \
	extension.js \
	prefs.js \
	stylesheet.css
nodist_extension_DATA = \
	changelog.txt \
	GNUGPLv3 \
	license.txt \
	metadata.json \
	readme.txt \
	icon.png

EXTRA_DIST = metadata.json.in
CLEANFILES = metadata.json

gschemas_in = $(gschemaname).gschema.xml.in
@INTLTOOL_XML_NOMERGE_RULE@
gsettings_SCHEMAS = $(gschemas_in:.xml.in=.xml)
@GSETTINGS_RULES@
CLEANFILES += $(gschemas_in:.xml.in=.valid) $(gsettings_SCHEMAS)

SUBDIRS = \
	images
EXTRA_DIST += $(gschemas_in)

metadata.json: metadata.json.in $(top_builddir)/config.status
	$(AM_V_GEN) sed \
		-e "s|[@]UUID@|$(uuid)|" \
		-e "s|[@]EXTENSIONID@|$(EXTENSION_ID)|" \
		-e "s|[@]EXTENSIONVERSION@|$(extensionversion)|" \
		-e "s|[@]EXTENSIONURL@|$(extensionurl)|" \
		-e "s|[@]GSCHEMANAME@|$(gschemaname)|" \
		$< > $@
