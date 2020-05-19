docker run \
  --cap-add=NET_ADMIN \
  --name covid19 \
  -p 443:443 \
  -p 80:80 \
  --detach \
  -e EMAIL=zhiyul@illinois.edu \
  -e URL=wherecovid19.cigi.illinois.edu \
  -v nginx_volume:/config \
  --mount type=bind,src=/var/covid19_project/nginx.conf,dst=/config/nginx/site-confs/default \
  --mount type=bind,src=/var/covid19_project/wherecovid19_webapp,dst=/var/www/covid19_app \
  linuxserver/letsencrypt
