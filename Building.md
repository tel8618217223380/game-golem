# Introduction #

Simply enough - join all the `*`.js (except `_`normal.user.js and `_`min.user.js) files together in the order given.


# Windows Details #

There is a build script included in the source if you want to automate building. Simply copy the build.txt to build.bat.

You are encouraged to edit it and make sure you are making full use of it by installing the [Closure Compiler](http://code.google.com/closure/compiler/) - this also reports and syntax bugs in your code.

You can also edit it to put your own Firefox path in to just need to refresh the page within firefox.

# Windows Build Script Source #

```
@echo off
rem -----------------------------------
rem Please copy this file as "buid.bat"
rem Edit to put in the correct paths for your system

echo Deleting old user.js files
del /F /Q _normal.user.js _min.user.js

rem ----------------------------------------------------------------------
rem REVISION - Current local revision (once committed it will be out of date)
rem Must have TortoiseSVN installed for this to work!

rem echo Creating revision file from TortoiseSVN...
rem SubWCRev.exe . _head_tortoise.tmpl _head_revision.js >nul

rem ----------------------------------------------------------------------
rem _normal.user.js
echo Joining files into _normal.user.js
type _head*.js >_normal.user.js 2>nul
type _main.js >>_normal.user.js 2>nul
type css.js >>_normal.user.js 2>nul
type utility.js >>_normal.user.js 2>nul
type worker.js >>_normal.user.js 2>nul
type worker_*.js >>_normal.user.js 2>nul

rem ----------------------------------------------------------------------
rem _normal_caap.user.js
echo Joining files into _normal_caap.user.js
copy _normal.user.js _normal_caap.user.js >nul
type worker++caap.js >>_normal_caap.user.js 2>nul

rem -----------------------------------------------------------------------
rem _normal_chrome.user.js
echo Joining files into _normal_chrome.user.js
type _head*.js >_normal_chrome.user.js 2>nul
type _jquery*.min.js >>_normal_chrome.user.js 2>nul
type _main.js >>_normal_chrome.user.js 2>nul
type css.js >>_normal_chrome.user.js 2>nul
type utility.js >>_normal_chrome.user.js 2>nul
type worker.js >>_normal_chrome.user.js 2>nul
type worker_*.js >>_normal_chrome.user.js 2>nul

rem ----------------------------------------------------------------------
rem _normal_chrome_caap.user.js
echo Joining files into _normal_chrome_caap.user.js
copy _normal.user.js _normal_chrome_caap.user.js >nul
type worker++caap.js >>_normal_chrome_caap.user.js 2>nul

rem ----------------------------------------------------------------------
rem INSTALLED VERSION - Means you only need to hit F5 / refresh in Firefox
rem Just change the path to your firefox installed version, only the '???' should need changing on Windows7

rem echo Installing new version to Firefox
rem copy _normal.user.js "C:\Documents and Settings\Owner\Application Data\Mozilla\Firefox\Profiles\of4omik4.default\gm_scripts\rycochets_castle_age_gol\rycochets_castle_age_gol.user.js" >nul

rem --------------------------------------------------------------------------------------
rem MINIMISED VERSION - This will fail on errors so use is advised - required for release!
rem Change path to compiler and source - obtain it from here:
rem http://code.google.com/closure/compiler/

rem echo Creating minimised version (will also show errors)
rem copy _head.js _min.user.js >nul
rem "C:\Program Files\Java\jre6\bin\java.exe" -jar "C:\Program Files\Compiler\compiler.jar" --js "_normal.user.js" >> "_min.user.js"

echo Press any key to quit.
pause>nul
```