#!/bin/bash

make_copy_data(){

	#Record previous copy
	cp us-states.csv us-states-tmp.csv
	cp us-counties.csv us-counties-tmp.csv
	cp ./nyt_counties_data.geojson nyt_counties_data-tmp.geojson
	cp ./nyt_states_data.geojson nyt_states_data-tmp.geojson
	cp ./classes.json classes-tmp.json
	#Copy needed datasets from parent directory
	cp ./counties_update_new.geojson .
	cp ./states_update.geojson .
	mkdir -p illinois
	cp ./illinois/nyt_illinois_counties_data.geojson ./illinois/nyt_illinois_counties_data-tmp.geojson

	cp ./illinois/idph_CountyDemos.json ./illinois/idph_CountyDemos-tmp.json
	cp ./illinois/idph_COVIDZip.json ./illinois/idph_COVIDZip-tmp.json
	cp ./illinois/idph_COVIDHistoricalTestResults.json ./illinois/idph_COVIDHistoricalTestResults-tmp.json
	cp ../illinois/dph_county_data.geojson ./illinois/dph_county_data-tmp.geojson
 	cp ./illinois/dph_county_static_data.geojson ./illinois/dph_county_static_data-tmp.geojson
	cp ./illinois/dph_zipcode_data.geojson ./illinois/ph_zipcode_data-tmp.geojson
	# WHO
	mkdir -p worldwide
	cp ./worldwide/World_Countries_Boundaries_new.geojson ./worldwide/World_Countries_Boundaries_new.geojson
	cp ./worldwide/who_world_data.geojson ./worldwide/who_world_data-tmp.geojson
	cp ./worldwide/global-covid19-who-gis.json ./worldwide/global-covid19-who-gis-tmp.json
	# IL Aaccessibility
	mkdir -p ./illinois
	mkdir -p ./illinois/Accessibility_Dissolve_Animation
	cp ./illinois/Chicago_ACC_dissolve.geojson ./illinois/Chicago_ACC_dissolve-tmp.geojson
	cp ./illinois/Illinois_ACC_dissolve.geojson ./illinois/Illinois_ACC_dissolve-tmp.geojson
	cp ./illinois/Accessibility_Dissolve_Animation/updates.txt ./illinois/Accessibility_Dissolve_Animation/updates-tmp.txt
	#IL Vulnerability
	mkdir -p ./illinois
	mkdir -p ./illinois/Vulnerability_Animation
	cp ./illinois/vulnerability.geojson ./illinois/vulnerability-tmp.geojson #1
	cp ./illinois/Vulnerability_Animation/updates.txt ./illinois/Vulnerability_Animation/updates-tmp.txt #1
}
setup_env(){
	cd /var/covid19_project/wherecovid19_webapp/preprocessing/cronjob
	source /opt/anaconda3/bin/activate covid19
}
should_preprocessing_be_done(){
	echo "Checking checksum"
	#calculate checksum
	chksum_count=`md5sum us-counties.csv | awk -F' '  '{print $1}'`
	chksum_count_tmp=`md5sum us-counties-tmp.csv | awk -F' '  '{print $1}'`
	#echo "$chksum_count; $chksum_count_tmp"
	#echo "$chksum_st; $chksum_st_tmp"
	if [ $chksum_count != $chksum_count_tmp ]
	then
	  echo "us-counties.csv updated"
		return 1
	fi

	chksum_st=`md5sum us-states.csv | awk -F' '  '{print $1}'`
        chksum_st_tmp=`md5sum us-states-tmp.csv | awk -F' '  '{print $1}'`
        if [ $chksum_st != $chksum_st_tmp ]
        then
          echo "us-states.csv updated"
          return 1
        fi

  chksum_idph1=`md5sum ./illinois/idph_COVIDZip.json | awk -F' '  '{print $1}'`
  chksum_idph1_tmp=`md5sum ./illinois/idph_COVIDZip-tmp.json | awk -F' '  '{print $1}'`
  if [ $chksum_idph1 != $chksum_idph1_tmp ]
  then
          echo "idph_COVIDZip.json updated"
          return 1
  fi

  chksum_idph2=`md5sum ./illinois/idph_CountyDemos.json | awk -F' '  '{print $1}'`
  chksum_idph2_tmp=`md5sum ./illinois/idph_CountyDemos-tmp.json | awk -F' '  '{print $1}'`
  if [ $chksum_idph2 != $chksum_idph2_tmp ]
  then
          echo "idph_CountyDemos.json updated"
          return 1
  fi

  chksum_idph3=`md5sum ./illinois/idph_COVIDHistoricalTestResults.json | awk -F' '  '{print $1}'`
  chksum_idph3_tmp=`md5sum ./illinois/idph_COVIDHistoricalTestResults-tmp.json | awk -F' '  '{print $1}'`
  if [ $chksum_idph3 != $chksum_idph3_tmp ]
  then
          echo "idph_COVIDHistoricalTestResults.json updated"
          return 1
  fi

  chksum_il_acc=`md5sum ./illinois/Accessibility_Dissolve_Animation/updates.txt | awk -F' '  '{print $1}'`
  chksum_il_acc_tmp=`md5sum ./illinois/Accessibility_Dissolve_Animation/updates-tmp.txt | awk -F' '  '{print $1}'`
  if [ $chksum_il_acc != $chksum_il_acc_tmp ]
  then
          echo "$chksum_il_acc; $chksum_il_acc_tmp"
          echo "Il Accessibility updated"
          return 1
  fi

  chksum_who=`md5sum ./worldwide/global-covid19-who-gis.json | awk -F' '  '{print $1}'`
  chksum_who_tmp=`md5sum ./worldwide/global-covid19-who-gis-tmp.json | awk -F' '  '{print $1}'`
  if [ $chksum_who != $chksum_who_tmp ]
  then
          echo "$chksum_who; $chksum_who_tmp"
          echo "global-covid19-who-gis.json updated"
          return 1
  fi

	return 0
}
download_files(){
	#Download new NYT data
	echo "Downloading NYT data" 
	#wget https://raw.githubusercontent.com/nytimes/covid-19-data/master/us.csv -O ./us.csv
	wget https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv -O  ./us-states.csv
	wget https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv -O ./us-counties.csv
	#IDPH
	wget -O ./illinois/idph_CountyDemos.json http://www.dph.illinois.gov/sitefiles/CountyDemos.json?nocache=1
	wget -O ./illinois/idph_COVIDZip.json http://www.dph.illinois.gov/sitefiles/COVIDZip.json?nocache=1
	wget -O ./illinois/idph_COVIDHistoricalTestResults.json http://www.dph.illinois.gov/sitefiles/COVIDHistoricalTestResults.json?nocache=1
	wget -O ./global-covid19-who-gis.json.gz https://dashboards-dev.sprinklr.com/data/9043/global-covid19-who-gis.json
        # WHO
        gunzip -f ./global-covid19-who-gis.json.gz
        mv -f ./global-covid19-who-gis.json ./worldwide/
        rm -f ./global-covid19-who-gis.json.gz
        # IL Accessibility
        mkdir -p ./illinois/Accessibility_Dissolve_Animation
        cp -v ../illinois/Accessibility_Dissolve_Animation/* ./illinois/Accessibility_Dissolve_Animation/
		# IL Vulnerability
		mkdir -p ./illinois/Vulnerability_Animation
        cp -v ../illinois/Vulnerability_Animation/* ./illinois/Vulnerability_Animation/ #2
        
}
convert_notebooks(){
        echo "Converting notebooks"
	jupyter nbconvert --to python --output-dir='.' ../states_new.ipynb
	jupyter nbconvert --to python --output-dir='.' ../counties_new.ipynb
	jupyter nbconvert --to python --output-dir='.' ../DefineInterval.ipynb
	jupyter nbconvert --to python --output-dir='./illinois/' ../illinois/extract_zipcode.ipynb
	jupyter nbconvert --to python --output-dir='./worldwide/' ../worldwide/world_layer_usingCountryID.ipynb
	jupyter nbconvert --to python --output-dir='./illinois/' ../illinois/accessibility_time_series.ipynb
	jupyter nbconvert --to python --output-dir='./illinois/' ../illinois/vulnerability_time_series.ipynb #3
}
run_state(){
	python states_new.py
	if [ $? -ne 0 ]
	then
		restore_data
		exit 1
	fi
}
run_counties(){
        python counties_new.py
        if [ $? -ne 0 ]
        then
                restore_data
                exit 1
        fi
}
run_defineintervels(){
        python DefineInterval.py
        if [ $? -ne 0 ]
        then
                restore_data
                exit 1
        fi
}
run_extract_zipcode(){
	cd illinois
   	python extract_zipcode.py
        if [ $? -ne 0 ]
        then
            	cd ..
		restore_data
                exit 1
        fi
	cd ..
}
run_world_layer_who(){
	cd worldwide
   	python world_layer_usingCountryID.py
        if [ $? -ne 0 ]
        then
            	cd ..
		restore_data
                exit 1
        fi
	cd ..
}

run_illinois_accessibility(){
        cd illinois
        python accessibility_time_series.py
        if [ $? -ne 0 ]
        then
            	cd ..
                restore_data
                exit 1
        fi
	cd ..
}

run_illinois_vulnerability(){
        cd illinois
        python vulnerability_time_series.py
        if [ $? -ne 0 ]
        then
            	cd ..
                restore_data
                exit 1
        fi
	cd ..
} #4

restore_data(){
	echo "restoring data"
        cp classes-tmp.json classes.json
	cp nyt_states_data-tmp.geojson nyt_states_data.geojson
	cp nyt_counties_data-tmp.geojson nyt_counties_data.geojson
        cp ./illinois/nyt_illinois_counties_data-tmp.geojson ./illinois/nyt_illinois_counties_data.geojson
	cp us-counties-tmp.csv us-counties.csv
	cp us-states-tmp.csv us-states.csv

	cp ./illinois/idph_CountyDemos-tmp.json ./illinois/idph_CountyDemos.json
        cp ./illinois/idph_COVIDZip-tmp.json ./illinois/idph_COVIDZip.json
        cp ./illinois/idph_COVIDHistoricalTestResults-tmp.json ./illinois/idph_COVIDHistoricalTestResults.json
        cp ./illinois/dph_county_data-tmp.geojson ./illinois/dph_county_data.geojson
	cp ./illinois/dph_county_static_data-tmp.geojson	./illinois/dph_county_static_data.geojson
	cp ./illinois/dph_zipcode_data-tmp.geojson	./illinois/dph_zipcode_data.geojson

	cp ./worldwide/who_world_data-tmp.geojson ./worldwide/who_world_data.geojson
	cp ./worldwide/global-covid19-who-gis-tmp.json ./worldwide/global-covid19-who-gis.json
        
	cp ./illinois/Chicago_ACC_dissolve-tmp.geojson ./illinois/Chicago_ACC_dissolve.geojson
	cp ./illinois/Illinois_ACC_dissolve-tmp.geojson ./illinois/Illinois_ACC_dissolve.geojson
	
	cp ./illinois/vulnerability-tmp.geojson ./illinois/vulnerability.geojson #5
  
        destroy_env
}
destroy_env(){
        conda deactivate
}
copy_back_results_webfolder(){
  #Copy needed datasets from parent dir
  cp us-states.csv ..
  cp us-counties.csv ..
  cp nyt_counties_data.geojson ..
  cp nyt_states_data.geojson ..
  cp classes.json ..
  cp ./illinois/nyt_illinois_counties_data.geojson ../illinois/
  cp ./illinois/dph_*_data.geojson ../illinois/
  cp ./worldwide/who_world_data.geojson ../worldwide/
  cp ./worldwide/global-covid19-who-gis.json ../worldwide/
  cp ./illinois/Chicago_ACC_dissolve.geojson ../illinois/
  cp ./illinois/Illinois_ACC_dissolve.geojson ../illinois/
  cp ./illinois/vulnerability.geojson ../illinois/ #6
}

setup_env
make_copy_data
download_files
should_preprocessing_be_done
if [ $? -ne 0 ]
then
	convert_notebooks
	run_state
	run_counties
	run_extract_zipcode
	run_world_layer_who
	run_illinois_accessibility
	run_illinois_vulnerability #7
	run_defineintervels
	copy_back_results_webfolder
fi
destroy_env
exit 0
