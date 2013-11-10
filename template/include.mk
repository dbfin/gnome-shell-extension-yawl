EXTENSION_ID = gnome-shell-extension-#%#name
EXTENSION_ID_SHORT = #%#name

extensionversion = 1

extensionbase = @dbfin.com
uuid = $(EXTENSION_ID_SHORT)$(extensionbase)
extensionurl = https://github.com/dbfin/gnome-shell-extension-yawl

topextensiondir = $(datadir)/gnome-shell/extensions
extensiondir = $(topextensiondir)/$(uuid)
imagesdir = $(extensiondir)/images

localprefix = $(HOME)/.local/share/gnome-shell/extensions
localextensiondir = $(localprefix)/$(uuid)

gschemabase = org.gnome.shell.extensions.dbfin
gschemaname = $(gschemabase).$(EXTENSION_ID_SHORT)
