# WhereCovid-19

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

WhereCOVID-19 is an online platform that provides a collection of static and dynamic maps for estimating the spread and exposure risk of COVID-19 at various spatial and temporal scales. Production deploy is at https://wherecovid19.cigi.illinois.edu.

  - Space-Time Explorer
  - Vulnerability Explorer
  - SpatialAccess

# New Features!

  - Now support shareable URL links


You can also:
  - Find daily cases/deaths and 7-day trend by clicking each feature
  - Search for places of interest
  - Play or scroll the slider bar to see the changes through months


### Tech

WhereCovid-19 uses a number of open source projects to work properly:

* [Leaflet] - open-source JavaScript library for mobile-friendly interactive maps
* [jQuery] - fast, small, and feature-rich JavaScript library
* [Popper] - tooltip & popover positioning engine
* [Bootstrap] - most popular front-end open source toolkit
* [Chart.js] - simple yet flexible JavaScript charting for designers & developers
* [Font Awesome] - most popular icon set and toolkit
* [Jupyter] - create and share documents that contain live code

And of course WhereCovid-19 itself is open source with a [public repository][wherecovid19_webapp]
 on GitHub.

### Getting Started

Clone this GitHub repo and open index.html with live server. 
If the newest data is needed, please download and run [preprocess_cron.sh][cronjob].

### Plugins

WhereCovid-19 is currently extended with the following plugins. Instructions on how to use them in your own application are linked below.

| Plugin | README |
| ------ | ------ |
| Esri Leaflet | https://github.com/Esri/esri-leaflet#esri-leaflet |
| Leaflet.timeline | https://github.com/skeate/Leaflet.timeline#leaflettimeline |
| leaflet-ajax | https://github.com/calvinmetcalf/leaflet-ajax#leaflet-ajax |
| leaflet-groupedlayercontrol | https://github.com/ismyrnow/leaflet-groupedlayercontrol#leaflet-groupedlayercontrol |
| leaflet-fullHash | https://github.com/KoGor/leaflet-fullHash#leaflet-fullhash |


### Development

Want to contribute? Great!

Please raise an issue if you find any bug or contact Dr. Zhiyu Li (zhiyul@illinois.edu) or Yong Liang (yongl3@illinois.edu)


### Todos

 - Publish as web service


### License

[Creative Commons Attribution-NonCommercial 4.0 International License] [License]

**WhereCovid-19 is an open-source platform.**

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)


   [Leaflet]: <https://leafletjs.com>
   [jQuery]: <http://jquery.com>
   [Popper]: <https://popper.js.org>
   [Bootstrap]: <https://getbootstrap.com>
   [Chart.js]: <https://www.chartjs.org>
   [Font Awesome]: <https://fontawesome.com>
   [Jupyter]: <https://jupyter.org>
   [wherecovid19_webapp]: <https://github.com/cybergis/wherecovid19_webapp>
   [cronjob]: <https://github.com/cybergis/wherecovid19_webapp/blob/refactor/preprocessing/cronjob/preprocess_cron.sh>
   [License]: <https://creativecommons.org/licenses/by-nc/4.0>
   
