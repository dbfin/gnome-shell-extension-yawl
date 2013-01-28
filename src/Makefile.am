include ../include.mk

dist_extension_DATA = \
	convenience2.js \
	dbfindebug.js \
	dbfinutils.js \
	dbfinyawl.js \
	extension.js \
	prefs.js \
	stylesheet.css
nodist_extension_DATA = \
	changelog.txt \
	GNUGPLv3 \
	license.txt \
	metadata.json \
	readme.txt

EXTRA_DIST = metadata.json.in
CLEANFILES = metadata.json

gschemas_in = $(gschemaname).gschema.xml.in
@INTLTOOL_XML_NOMERGE_RULE@
gsettings_SCHEMAS = $(gschemas_in:.xml.in=.xml)
@GSETTINGS_RULES@
CLEANFILES += $(gschemas_in:.xml.in=.valid) $(gsettings_SCHEMAS)
EXTRA_DIST += $(gschemas_in)

metadata.json: metadata.json.in $(top_builddir)/config.status
	$(AM_V_GEN) sed \
		-e "s|[@]UUID@|$(uuid)|" \
		-e "s|[@]EXTENSIONID@|$(EXTENSION_ID)|" \
		-e "s|[@]EXTENSIONVERSION@|$(extensionversion)|" \
		-e "s|[@]EXTENSIONURL@|$(extensionurl)|" \
		-e "s|[@]GSCHEMANAME@|$(gschemaname)|" \
		$< > $@

