@echo off

rem Create the log graphs etc

python C:\Python27\Lib\site-packages\svnplot\svnlog2sqlite.py -v -l http://game-golem.googlecode.com/svn/ golem.sqlite
rmdir /Q golem  >nul 2>nul
md golem
python C:\Python27\Lib\site-packages\svnplot\svnplot-js.py -v -j -n 'GameGolem' -s /trunk golem.sqlite golem\
rem This one doesn't look as good
rem python C:\Python27\Lib\site-packages\svnplot\svnplot.py -v -n 'GameGolem' -s /trunk golem.sqlite golem\
