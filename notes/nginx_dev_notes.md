# Nginx Dev Notes

## WSL Directory
cd /mnt/c/Users/Admin/OneDrive/מסמכים/תואר ראשון דו חוגי/פרוייקט דיגיטליים/nginx

## Start nginx after WSL opens
sudo service nginx start

## Update & restart nginx
sudo cp conf/default.conf /etc/nginx/conf.d/default.conf && sudo nginx -t && sudo service nginx restart

## Git — Save progress so far (without ending work)
git add .
git commit -m "feat(nginx): describe what you did"

## Git — End of day (save + upload)
git add .
git commit -m "feat(nginx): describe what you did"
git push origin feature/nginx_sprint2

## Git — Start of new day
sudo service nginx start
git pull