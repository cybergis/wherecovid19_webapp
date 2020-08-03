// Define the number of maps and some configuration parameters that you want to visualize.

var SubjectName = "COVID-19";
var InitialLayers = [" total_count", "2018"];

/* Map Extent and Zoom level will be automatically adjusted when you do not define map center and zoom level */
//var Initial_map_center = [34.0522, -117.9];  
//var Initial_map_zoom_level = 8;   


var allMetros = false;                                      //choropleth map: Maps representing INC of all metros
var Index_of_neighborhood_change = true;					//choropleth map: Maps representing index of neighborhood Change
var Maps_of_neighborhood = true;							//choropleth map: Maps representing clustering result  
var Distribution_INC1 = true;								//density chart: INC changes as the map extent changes 
var Distribution_INC2_different_period = false;				//density chart: INC changes by different years
var Distribution_INC2_different_cluster = false;				//density chart: INC changes by different clusters
var Temporal_change_in_neighborhoods = true;				//stacked chart: Temporal Change in Neighborhoods over years
var Parallel_Categories_Diagram_in_neighborhoods = true;	//parallel categories diagram
var Chord_Diagram_in_neighborhoods = true;					//chord diagram
var Zscore_Means_across_Clusters = true;                    //heatmap: Z Score Means across Clusters
var Zscore_Means_of_Each_Cluster = true;                    //barchart: Z Score Means of Each Cluster
var Barchart_of_Subject_Clusters = 3;                       //Number of subject barchart for cluster count

  

var Num_Of_Decimal_Places = 2;                             // default = 2

var Map_width  = "450px";                                  // min 350px
var Map_height = "450px";                                  // min 300px


/////////////////////////////////////////////////////////////////
// Options for only INC map                                    //
/////////////////////////////////////////////////////////////////

//option for class(the classification method): equal, quantile, ckmeans, std, arithmetic, geometric
//option for count(the number of classes): 1 to 8  (Only Red color scheme has up to 10)
//options for color scheme of INC map: Green, Blue, Orange, Red, Pink

var mapAclassification = {class: 'quantile', count: 8, color: 'Orange'};

/////////////////////////////////////////////////////////////////
// Options for change order of clusters for visualization      //
// uncomment below and enter cluster numbers in from:to format //
/////////////////////////////////////////////////////////////////
//var CHANGE_CLUSTER = { 0:0, 1:1, 2:2, 3:3, 4:4, 5:5 }