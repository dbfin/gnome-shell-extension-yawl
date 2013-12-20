EXTENSION_ID = gnome-shell-extension-aa
EXTENSION_ID_SHORT = aa

extensionversion = 3

extensionbase = @dbfin.com
uuid = $(EXTENSION_ID_SHORT)$(extensionbase)
extensionurl = https://github.com/dbfin/gnome-shell-extension-yawl/tree/aa

topextensiondir = $(datadir)/gnome-shell/extensions
extensiondir = $(topextensiondir)/$(uuid)
imagesdir = $(extensiondir)/images

localprefix = $(HOME)/.local/share/gnome-shell/extensions
localextensiondir = $(localprefix)/$(uuid)

gschemabase = org.gnome.shell.extensions.dbfin
gschemaname = $(gschemabase).$(EXTENSION_ID_SHORT)
