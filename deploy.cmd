@echo off
git add *
git commit -m %1
git push -f -u origin main