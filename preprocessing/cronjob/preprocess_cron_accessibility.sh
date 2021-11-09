#!/bin/bash

make_copy_data(){

	#Record previous copy
	mkdir -p illinois

	# IL Aaccessibility
	mkdir -p ./illinois/Accessibility_Dissolve_Animation
	cp ./illinois/Chicago_ACC_i.geojson ./illinois/Chicago_ACC_i-tmp.geojson
	cp ./illinois/Illinois_ACC_i.geojson ./illinois/Illinois_ACC_i-tmp.geojson
  cp ./illinois/Chicago_ACC_v.geojson ./illinois/Chicago_ACC_v-tmp.geojson
  cp ./illinois/Illinois_ACC_v.geojson ./illinois/Illinois_ACC_v-tmp.geojson
	cp ./illinois/Accessibility_Dissolve_Animation/updates.txt ./illinois/Accessibility_Dissolve_Animation/updates-tmp.txt
	
}
setup_env(){
	cd /var/covid19_project/wherecovid19_service/wherecovid19_webapp/preprocessing/cronjob
	source /opt/anaconda3/bin/activate covid19
}
should_preprocessing_be_done(){
	echo "Checking checksum"
	#calculate checksum

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

    # IL Accessibility
    mkdir -p ./illinois/Accessibility_Dissolve_Animation
    rsync -a ../illinois/Accessibility_Dissolve_Animation/* ./illinois/Accessibility_Dissolve_Animation/

}
convert_notebooks(){
        echo "Converting notebooks"
	jupyter nbconvert --to python --output-dir='./illinois/' ../illinois/accessibility_time_series.ipynb
	}
run_defineintervels(){
echo "skipping run_defineintervels"
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


restore_data(){
	echo "restoring data"
    

	cp ./illinois/Chicago_ACC_i-tmp.geojson ./illinois/Chicago_ACC_i.geojson
	cp ./illinois/Illinois_ACC_i-tmp.geojson ./illinois/Illinois_ACC_i.geojson
    cp ./illinois/Chicago_ACC_v-tmp.geojson ./illinois/Chicago_ACC_v.geojson
    cp ./illinois/Illinois_ACC_v-tmp.geojson ./illinois/Illinois_ACC_v.geojson
  
        destroy_env
}
destroy_env(){
        conda deactivate
}
copy_back_results_webfolder(){
  #Copy needed datasets from parent dir
  cp ./illinois/Chicago_ACC_?.geojson ../illinois/
  cp ./illinois/Illinois_ACC_?.geojson ../illinois/

}
copy_to_shared_folder(){
  base_dir=/data/cigi/cybergis-jupyter/production_data/notebook_shared_data/data/wherecovid19_data/app
  pro_other=$base_dir/processed/other

  cp ./illinois/Chicago_ACC_?.geojson $pro_other
  cp ./illinois/Illinois_ACC_?.geojson $pro_other

}


setup_env
make_copy_data
download_files
should_preprocessing_be_done
if [ $? -ne 0 ]
then
	convert_notebooks
	run_illinois_accessibility
	run_defineintervels
	copy_back_results_webfolder
  copy_to_shared_folder
fi
destroy_env
exit 0
