#!/bin/bash

make_copy_data(){

	#Record previous copy
	
    # WHO
	mkdir -p worldwide
	cp ../worldwide/World_Countries_Boundaries_new.geojson ./worldwide/World_Countries_Boundaries_new.geojson
	cp ./worldwide/who_world_data.geojson ./worldwide/who_world_data-tmp.geojson
	#cp ./worldwide/global-covid19-who-gis.json ./worldwide/global-covid19-who-gis-tmp.json
	cp ./worldwide/WHO-COVID-19-global-data.csv ./worldwide/WHO-COVID-19-global-data-tmp.csv
    cp ../worldwide/world_population.csv ./worldwide/
}
setup_env(){
	cd /var/covid19_project/wherecovid19_service/wherecovid19_webapp/preprocessing/cronjob
	source /opt/anaconda3/bin/activate covid19
}
should_preprocessing_be_done(){
	echo "Checking checksum"
	#calculate checksum

    #chksum_who=`md5sum ./worldwide/global-covid19-who-gis.json | awk -F' '  '{print $1}'`
    #chksum_who_tmp=`md5sum ./worldwide/global-covid19-who-gis-tmp.json | awk -F' '  '{print $1}'`
    chksum_who=`md5sum ./worldwide/WHO-COVID-19-global-data.csv | awk -F' '  '{print $1}'`
    chksum_who_tmp=`md5sum ./worldwide/WHO-COVID-19-global-data-tmp.csv | awk -F' '  '{print $1}'`
    if [ $chksum_who != $chksum_who_tmp ]
    then
            echo "$chksum_who; $chksum_who_tmp"
            #echo "global-covid19-who-gis.json updated"
            echo "WHO-COVID-19-global-data.csv"
            return 1
    fi

	return 0
}
download_files(){
	#Download new WHO data
	echo "Downloading WHO data" 
	
    #wget -O ./global-covid19-who-gis.json https://covid19.who.int/page-data/index/page-data.json
    #mv -f ./global-covid19-who-gis.json ./worldwide/

    wget -O ./WHO-COVID-19-global-data.csv https://covid19.who.int/WHO-COVID-19-global-data.csv
    mv -f ./WHO-COVID-19-global-data.csv ./worldwide/
}
convert_notebooks(){
        echo "Converting notebooks"
	jupyter nbconvert --to python --output-dir='./worldwide/' ../worldwide/world_layer_usingCountryID.ipynb
}
run_defineintervels(){
        python DefineInterval.py
        if [ $? -ne 0 ]
        then
                restore_data
                exit 1
        fi
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
restore_data(){
	echo "restoring data"

	cp ./worldwide/who_world_data-tmp.geojson ./worldwide/who_world_data.geojson
	#cp ./worldwide/global-covid19-who-gis-tmp.json ./worldwide/global-covid19-who-gis.json
	cp ./worldwide/WHO-COVID-19-global-data-tmp.csv ./worldwide/WHO-COVID-19-global-data.csv
  
        destroy_env
}
destroy_env(){
        conda deactivate
}
copy_back_results_webfolder(){
  #Copy needed datasets from parent dir
  cp classes.json ../

  cp ./worldwide/who_world_data.geojson ../worldwide/
  #cp ./worldwide/global-covid19-who-gis.json ../worldwide/
  cp ./worldwide/WHO-COVID-19-global-data.csv ../worldwide/
}

copy_to_shared_folder(){
  base_dir=/data/cigi/cybergis-jupyter/production_data/notebook_shared_data/data/wherecovid19_data/app
  raw_idph=$base_dir/raw/idph
  raw_nyt=$base_dir/raw/nyt
  raw_who=$base_dir/raw/who
  #cp ./worldwide/global-covid19-who-gis.json $raw_who
  cp ./worldwide/WHO-COVID-19-global-data.csv $raw_who

  pro_cases=$base_dir/processed/cases
  pro_other=$base_dir/processed/other
  pro_static=$base_dir/processed/static
  cp ./worldwide/who_world_data.geojson $pro_cases
}


setup_env
make_copy_data
download_files
should_preprocessing_be_done
if [ $? -ne 0 ]
then
	convert_notebooks
	run_world_layer_who
	run_defineintervels
	copy_back_results_webfolder
        copy_to_shared_folder
fi
destroy_env
exit 0
