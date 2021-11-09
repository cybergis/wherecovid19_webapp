#!/bin/bash

make_copy_data(){

	#Record previous copy
  # idph county data
	mkdir -p illinois
  cp ./illinois/idph_county_historical.csv ./illinois/idph_county_historical-tmp.csv
	cp ./illinois/dph_county_data.geojson ./illinois/dph_county_data-tmp.geojson
	cp ./illinois/classes_idph.json ./illinois/classes_idph-tmp.json

}
setup_env(){
	cd /var/covid19_project/wherecovid19_service/wherecovid19_webapp/preprocessing/cronjob
	source /opt/anaconda3/bin/activate covid19
}
should_preprocessing_be_done(){
	echo "Checking checksum"
	#calculate checksum

    chksum_idph3=`md5sum ./illinois/idph_county_historical.csv | awk -F' '  '{print $1}'`
    chksum_idph3_tmp=`md5sum ./illinois/idph_county_historical-tmp.csv | awk -F' '  '{print $1}'`
    if [ $chksum_idph3 != $chksum_idph3_tmp ]
    then
            echo "idph_county_historical.csv updated"
            return 1
    fi

	return 0
}
download_files(){
	
    #Download new IDPH data
	  echo "Downloading IDPH data"
	
    #IDPH
    mkdir -p ./illinois
	  wget -O ./illinois/idph_county_historical.csv https://idph.illinois.gov/DPHPublicInformation/api/COVIDExport/GetSnapshotHistorical?format=csv
        
}
convert_notebooks(){
        echo "Converting notebooks"
	jupyter nbconvert --to python --output-dir='./illinois/' ../illinois/DefineInterval_idph.ipynb
	jupyter nbconvert --to python --output-dir='./illinois/' ../illinois/idph_county.ipynb
}
run_defineintervels(){
        echo "run_defineintervels"
        cd illinois
        python DefineInterval_idph.py
        if [ $? -ne 0 ]
        then
                restore_data
                exit 1
        fi
        cd ..
}
run_idph_county(){
    echo "run_idph_county"
	  cp ../illinois/idph_county_geometry.geojson ./illinois/
    cd illinois
   	python idph_county.py
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
    
    cp ./illinois/classes_idph-tmp.json ./illinois/classes_idph.json
    cp ./illinois/idph_county_historical-tmp.csv ./illinois/idph_county_historical.csv
    cp ./illinois/dph_county_data-tmp.geojson ./illinois/dph_county_data.geojson
  
    destroy_env
}
destroy_env(){
        conda deactivate
}
copy_back_results_webfolder(){
  #Copy needed datasets from parent dir
  cp ./illinois/classes_idph.json ../illinois/
 
  cp ./illinois/dph_*_data.geojson ../illinois/
  cp ./illinois/idph_county_historical.csv ../illinois/

}
copy_to_shared_folder(){
  base_dir=/data/cigi/cybergis-jupyter/production_data/notebook_shared_data/data/wherecovid19_data/app
  raw_idph=$base_dir/raw/idph
  cp ./illinois/idph_county_historical.csv $raw_idph

  pro_cases=$base_dir/processed/cases
  cp ./illinois/dph_county_data.geojson $pro_cases
}


setup_env
make_copy_data
download_files
should_preprocessing_be_done
if [ $? -ne 0 ]
then
	convert_notebooks
	run_idph_county
	run_defineintervels
	copy_back_results_webfolder
  copy_to_shared_folder
fi
destroy_env
exit 0
