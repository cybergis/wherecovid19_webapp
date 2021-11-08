#!/bin/bash

make_copy_data(){

	#Record previous copy
    
    # idph county data
	mkdir -p illinois
    cp ./illinois/idph_county_historical.csv ./illinois/idph_county_historical-tmp.csv
	cp ./illinois/dph_county_data.geojson ./illinois/dph_county_data-tmp.geojson


	# IL Aaccessibility
	mkdir -p ./illinois
	mkdir -p ./illinois/Accessibility_Dissolve_Animation
	cp ./illinois/Chicago_ACC_i.geojson ./illinois/Chicago_ACC_i-tmp.geojson
	cp ./illinois/Illinois_ACC_i.geojson ./illinois/Illinois_ACC_i-tmp.geojson
        cp ./illinois/Chicago_ACC_v.geojson ./illinois/Chicago_ACC_v-tmp.geojson
        cp ./illinois/Illinois_ACC_v.geojson ./illinois/Illinois_ACC_v-tmp.geojson
	cp ./illinois/Accessibility_Dissolve_Animation/updates.txt ./illinois/Accessibility_Dissolve_Animation/updates-tmp.txt
	
    #IL Vulnerability
	mkdir -p ./illinois
	mkdir -p ./illinois/Vulnerability_Animation
	cp ./illinois/vulnerability.geojson ./illinois/vulnerability-tmp.geojson #1
	cp ./illinois/Vulnerability_Animation/updates.txt ./illinois/Vulnerability_Animation/updates-tmp.txt #1
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

    chksum_il_acc=`md5sum ./illinois/Accessibility_Dissolve_Animation/updates.txt | awk -F' '  '{print $1}'`
    chksum_il_acc_tmp=`md5sum ./illinois/Accessibility_Dissolve_Animation/updates-tmp.txt | awk -F' '  '{print $1}'`
    if [ $chksum_il_acc != $chksum_il_acc_tmp ]
    then
            echo "$chksum_il_acc; $chksum_il_acc_tmp"
            echo "Il Accessibility updated"
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

    # IL Accessibility
    mkdir -p ./illinois/Accessibility_Dissolve_Animation
    rsync -a ../illinois/Accessibility_Dissolve_Animation/* ./illinois/Accessibility_Dissolve_Animation/
    
    # IL Vulnerability
    mkdir -p ./illinois/Vulnerability_Animation
    rsync -a ../illinois/Vulnerability_Animation/* ./illinois/Vulnerability_Animation/ #2
        
}
convert_notebooks(){
        echo "Converting notebooks"
	jupyter nbconvert --to python --output-dir='.' ../DefineInterval.ipynb
	jupyter nbconvert --to python --output-dir='./illinois/' ../illinois/idph_county.ipynb
	jupyter nbconvert --to python --output-dir='./illinois/' ../illinois/accessibility_time_series.ipynb
	jupyter nbconvert --to python --output-dir='./illinois/' ../illinois/vulnerability_time_series.ipynb #3
}
run_defineintervels(){
        echo "run_defineintervels"
        python DefineInterval.py
        if [ $? -ne 0 ]
        then
                restore_data
                exit 1
        fi
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
run_illinois_accessibility(){
        echo "run_illinois_accessibility"
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
        echo "run_illinois_vulnerability"
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
    cp ./illinois/idph_county_historical-tmp.csv ./illinois/idph_county_historical.csv
    cp ./illinois/dph_county_data-tmp.geojson ./illinois/dph_county_data.geojson
        
	cp ./illinois/Chicago_ACC_i-tmp.geojson ./illinois/Chicago_ACC_i.geojson
	cp ./illinois/Illinois_ACC_i-tmp.geojson ./illinois/Illinois_ACC_i.geojson
    cp ./illinois/Chicago_ACC_v-tmp.geojson ./illinois/Chicago_ACC_v.geojson
    cp ./illinois/Illinois_ACC_v-tmp.geojson ./illinois/Illinois_ACC_v.geojson	

	cp ./illinois/vulnerability-tmp.geojson ./illinois/vulnerability.geojson #5
  
        destroy_env
}
destroy_env(){
        conda deactivate
}
copy_back_results_webfolder(){
  #Copy needed datasets from parent dir
  cp classes.json ../
 
  cp ./illinois/dph_*_data.geojson ../illinois/
  cp ./illinois/idph_county_historical.csv ../illinois/

  cp ./illinois/Chicago_ACC_?.geojson ../illinois/
  cp ./illinois/Illinois_ACC_?.geojson ../illinois/
  cp ./illinois/vulnerability.geojson ../illinois/
}
copy_to_shared_folder(){
  base_dir=/data/cigi/cybergis-jupyter/production_data/notebook_shared_data/data/wherecovid19_data/app
  raw_idph=$base_dir/raw/idph
  raw_nyt=$base_dir/raw/nyt
  raw_who=$base_dir/raw/who
  cp ./illinois/idph_county_historical.csv $raw_idph

  pro_cases=$base_dir/processed/cases
  pro_other=$base_dir/processed/other
  pro_static=$base_dir/processed/static
  cp ./illinois/dph_county_data.geojson $pro_cases
  cp ./illinois/Chicago_ACC_?.geojson $pro_other
  cp ./illinois/Illinois_ACC_?.geojson $pro_other
  cp ./illinois/vulnerability.geojson $pro_other
}


setup_env
make_copy_data
download_files
should_preprocessing_be_done
if [ $? -ne 0 ]
then
	convert_notebooks
	run_idph_county
	run_illinois_accessibility
	run_illinois_vulnerability #7
	run_defineintervels
	copy_back_results_webfolder
        copy_to_shared_folder
fi
destroy_env
exit 0
