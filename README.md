## YAWL: Yet Another Window List, Alternative Activities

##### GNOME Shell Extensions

_Copyright © 2012-2013 Vadim Cherepanov @ dbFin (vadim (at) dbfin.com)_

License: GNU GPL v3, please read src/license.txt
 
### Description
 
YAWL is a collection of GNOME Shell extensions, including the Yet Another Window List (taskbar) extension providing many features of a typical dock being integrated into GNOME Shell. YAWL aims to be simple to use and provide maximum convenience and consistency while supporting many advanced features and customizations.

### Yet Another Window List (taskbar)

 ![ ](yawl/src/screenshot.png?raw=true)

**Main features include**:

1.  task bar with thumbnails;
1.  "window peeking" to preview window by hovering its thumbnail;
1.  advanced menus including list of windows on all workspaces, app-specific menus, and Quicklists;
1.  favorite apps;
1.  icon reordering preserved across reboots;
1.  window attention indicators;
1.  scrolling over panel to change workspace + "smart scroll" to search app's windows on other workspaces;

and many more.

The extension works out of the box but provides numerous settings to adjust its look and behavior to your liking.

### Alternative Activities: branch aa

 ![ ](https://github.com/dbfin/gnome-shell-extension-yawl/blob/aa/aa/src/screenshot.png?raw=true)

**Main features include**:

1.  Activities button showing current workspace number (scroll over to change workspace);
1.  Right click menu with the list of current workspaces (icons of running apps) and installed extensions;
1.  Quick access to extension preferences as well as basic extension management: enabling/disabling/restarting/reloading;
1.  Options to show all or selected (favorite) extensions only, and sort them by name or according to access frequency;
1.  Additional menu options to access Advanced settings;
1.  Built-in and support for custom themes;

and more.

### How to install Yet Another Window List

If you are not a developer and not interested in testing the latest commits, then the best way to install/update the extension is by following this <a href="https://extensions.gnome.org/extension/674/yawl-yet-another-window-list/" target="_blank" title="YAWL on extensions.gnome.org">link</a>. If in the description you see that there is a newer version that is still under review, please feel free to manually download it using the link provided there and unzip it to _~/.local/share/gnome-shell/extensions/yawl@dbfin\.com_.

If you want to keep up with the latest features that have not made it yet into an official release, or want to contribute, please follow these simple steps:

1.  One time: clone the repository.

        cd /path/to/where/you/want/subdir/with/yawl
        git clone https://github.com/dbfin/gnome-shell-extension-yawl
        cd gnome-shell-extension-yawl

1.  Next time you want to update the source code: pull updates.

        cd /path/to/where/you/have/subdir/with/yawl/gnome-shell-extension-yawl
        git pull

    If you changed some code yourself and git gives you errors when you run this command (saying something about merging), please consult Git manual.

1.  Every time you update source code: just run install-extension.

        cd /path/to/where/you/have/subdir/with/yawl/gnome-shell-extension-yawl
        ./install-extension yawl

    If it gives errors please make sure you have all necessary dev-libraries installed. These include:

  - On **ubuntu**: sudo apt-get install gnome-common autoconf autogen automake intltool libglib2.0-dev
  - On **fedora**: sudo yum install gnome-common autoconf autogen automake intltool glib2-devel
  - On other OS: please find corresponding packages

### How to install other YAWL extensions

The procedure is similar, except if you use extensions.gnome.org site to install the extension, you need to search for the one you want to install.

And if you install extension from the GitHub repository, then it might be more convenient to checkout the corresponding branch into a separate directory:

``` bash
cd /path/to/where/you/want/subdir/with/branch
git clone https://github.com/dbfin/gnome-shell-extension-yawl branch
cd branch
git checkout branch
./install-extension branch
```

where branch for each extension is listed above, such as aa for Alternative Activities.
