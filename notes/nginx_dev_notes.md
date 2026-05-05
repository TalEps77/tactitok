# Nginx Dev Notes

## WSL Directory
cd /mnt/c/Users/Admin/OneDrive/מסמכים/תואר ראשון דו חוגי/פרוייקט דיגיטליים/nginx

## Update & restart nginx
sudo cp conf/default.conf /etc/nginx/conf.d/default.conf && sudo nginx -t && sudo service nginx restart

## Start nginx after WSL opens
sudo service nginx start