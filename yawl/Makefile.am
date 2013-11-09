ACLOCAL_AMFLAGS = -I m4 ${ACLOCAL_FLAGS}
SUBDIRS = src po

include include.mk

zip-file: all
	-rm -fR $(builddir)/Build
	-rm -fR $(builddir)/zip
	$(MKDIR_P) $(builddir)/Build; \
	$(MKDIR_P) $(builddir)/zip; \
	$(MAKE) install DESTDIR="$(abs_builddir)/Build"; \
	cp -r "$(builddir)/Build$(extensiondir)" "$(builddir)/Build/"; \
	cp -r "$(builddir)/Build$(datadir)/locale" "$(builddir)/Build/$(uuid)"; \
	if [ -f "$(builddir)/Build$(datadir)/glib-2.0/schemas/$(gschemabase).$(EXTENSION_ID_SHORT).gschema.xml" ]; then \
		$(MKDIR_P) "$(builddir)/Build/$(uuid)/schemas"; \
		cp "$(builddir)/Build$(datadir)/glib-2.0/schemas/$(gschemabase).$(EXTENSION_ID_SHORT).gschema.xml" "$(builddir)/Build/$(uuid)/schemas"; \
		glib-compile-schemas "$(builddir)/Build/$(uuid)/schemas"; \
	fi; \
	( cd "$(builddir)/Build/$(uuid)"; \
		zip -qr "$(abs_builddir)/zip/$(uuid).shell-extension.zip" .; \
	);
	-rm -fR $(builddir)/Build

local-install: zip-file
	if [ -d "$(localextensiondir)" ]; then \
		rm -fR "$(localextensiondir)"; \
	fi; \
	$(MKDIR_P) "$(localextensiondir)"; \
	(cd "$(localextensiondir)"; \
		unzip -q "$(abs_builddir)/zip/$(uuid).shell-extension.zip"; \
	);

local-uninstall: Makefile
	if [ -d "$(localextensiondir)" ]; then \
		rm -fR "$(localextensiondir)"; \
	fi;

