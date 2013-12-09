EXTENSION_ID = gnome-shell-extension-yawl
EXTENSION_ID_SHORT = yawl

extensionversion = 15

extensionbase = @dbfin.com
uuid = $(EXTENSION_ID_SHORT)$(extensionbase)
extensionurl = https://github.com/dbfin/$(EXTENSION_ID)

topextensiondir = $(datadir)/gnome-shell/extensions
extensiondir = $(topextensiondir)/$(uuid)
imagesdir = $(extensiondir)/images

localprefix = $(HOME)/.local/share/gnome-shell/extensions
localextensiondir = $(localprefix)/$(uuid)

gschemabase = org.gnome.shell.extensions.dbfin
gschemaname = $(gschemabase).$(EXTENSION_ID_SHORT)
