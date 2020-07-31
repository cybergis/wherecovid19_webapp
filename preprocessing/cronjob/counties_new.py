#!/usr/bin/env python
# coding: utf-8

# In[177]:


import pandas as pd
import numpy as np
from datetime import datetime
import geopandas as gpd
import mapclassify as mc


# Step0:  
# Read Data and get basic county groups

# 0.0 Report Data

# In[178]:


df_counties_original = pd.read_csv("./us-counties.csv", dtype={"date": np.string_, 
                                                             "county": np.string_,
                                                             "state": np.string_,
                                                             "fips": np.string_,
                                                            "cases": np.int32,
                                                            "deaths": np.int32})
#Tansform Unknown fips to '00000' 
df_counties_original['fips'] = df_counties_original['fips'].replace({np.nan: '00000'})
df_counties_original.sort_values("fips", ascending=True)


# 0.1 GeoJSON Data

# In[179]:


old_counties_geojson_df = gpd.read_file(r"./counties_update_new.geojson")
old_counties_geojson_df.head(5)


# Group Data to Counties

# In[180]:


pivot_counties = pd.pivot_table(df_counties_original , index=['state','county','fips'],
                       columns=['date'])
pivot_counties = pivot_counties.replace(np.nan, 0).astype(int)
pivot_counties


# 0.3 Get Date Info

# In[181]:


date= pivot_counties['cases'].columns
date


# In[182]:


date_str = np.sort(date)
dt_str_start=np.min(date_str)
dt_str_end=np.max(date_str)


# In[183]:


dt_start = datetime.strptime(dt_str_start, "%Y-%m-%d")
dt_end = datetime.strptime(dt_str_end, "%Y-%m-%d")
dt_range = pd.date_range(start=dt_start,end=dt_end)
print(len(dt_range), dt_range)
dt_range_str = list(map(lambda x: x.strftime("%Y-%m-%d"), dt_range.tolist()))
print(len(dt_range_str), dt_range_str)


# Step1:  
# Add Cases Time Series, First Case Date, Death Time Series, First Death Date

# In[184]:


# import json
# pivot_counties['cases_ts'] = json.dumps({"values": pivot_counties['cases'].values.tolist()[0]})
# pivot_counties['deaths_ts'] =  json.dumps({"values": pivot_counties['deaths'].values.tolist()[0]})

pivot_counties['cases_ts'] =  pivot_counties['cases'].values.tolist()
pivot_counties['deaths_ts'] =  pivot_counties['deaths'].values.tolist()


# Form Dynamic classes for new_case and new_death 

# In[185]:


new_case_dict = {}
for i in range(1,len(date)):
    q6 = mc.Quantiles(pivot_counties['cases_ts'].apply(lambda x: x[i] - x[i - 1]).values, k=6)
    new_case_dict[i] = ','.join(q6.bins.astype(int).astype(str))


# In[186]:


dynamic_cl_dict = {}
dynamic_cl_dict['county'] = {'new_case':new_case_dict, 'new_death':{}}
dynamic_cl_dict['state'] = {}


# In[187]:


import json
with open('dynamic_classes.json','w') as json_file:
    json.dump(dynamic_cl_dict, json_file)


# In[188]:


pivot_counties['dt_first_case'] = (pivot_counties['cases'] > 0).idxmax(axis=1)
pivot_counties['dt_first_death'] = (pivot_counties['deaths'] > 0).idxmax(axis=1)
#For death reports, deal with no deaths counties
pivot_counties.loc[pivot_counties['deaths'].iloc[:, -1] <= 0, 'dt_first_death'] = np.nan
pivot_counties.head(5)


# Step2:  
# Add today_case, today_new_case, today_death, today_new_death

# In[189]:


yesterday = date.values[-2]
pivot_counties['today_case'] = pivot_counties['cases'][dt_str_end]
pivot_counties['today_new_case'] = pivot_counties['cases'][dt_str_end] - pivot_counties['cases'][yesterday]
pivot_counties['today_death'] = pivot_counties['deaths'][dt_str_end]
pivot_counties['today_new_death'] = pivot_counties['deaths'][dt_str_end] - pivot_counties['deaths'][yesterday]


# Step3:  
# Extract necessary columns

# In[190]:


report_df = pivot_counties[['cases_ts','deaths_ts','dt_first_case','dt_first_death','today_case','today_new_case', 'today_death','today_new_death']]
report_df = report_df.reset_index()
report_df.columns = ['state','county','fips','cases_ts','deaths_ts','dt_first_case','dt_first_death','today_case','today_new_case', 'today_death','today_new_death']
report_df.head(5)


# In[191]:


report_df['cases_ts'][1]


# Step4:  
# Assign Geometries to counties

# In[192]:


final_df = pd.merge(old_counties_geojson_df[["NAME", "state_name", "GEOID", "population", "geometry"]], report_df, how='left', left_on=['NAME','state_name'], right_on = ['county','state'])
final_df.columns


# Step5:  
# Deal with nan values (Counties not shows up in geojson) (More works)

# In[193]:


final_df[['today_case','today_new_case','today_death','today_new_death']] = final_df[['today_case','today_new_case','today_death','today_new_death']].replace(np.nan,0)
final_df['fips'] = final_df['fips'].replace(np.nan, final_df['GEOID'])


# In[194]:


template =final_df[~final_df['cases_ts'].isna()]['cases_ts']
template = template.iloc[0]


# In[195]:


for x in range(0,len(template)):
    template[x] = 0
template = ','.join(map(str, template))


# In[196]:



final_df['cases_ts'] = final_df['cases_ts'].apply(lambda x: ','.join(map(str, x)) if type(x) is list else template)
final_df['deaths_ts'] = final_df['deaths_ts'].apply(lambda x: ','.join(map(str, x)) if type(x) is list else template)
final_df.head(5)


# Step6:  
# Finalize the Dataframe

# In[197]:
































final_df=final_df[["NAME", "state_name", "population", "fips", "dt_first_case", "dt_first_death", "cases_ts", "deaths_ts", 
                   'today_case','today_new_case','today_death','today_new_death', "geometry"]]
final_df['dt_start'] = dt_str_start
final_df['dt_end'] = dt_str_end
final_df['dt_unit'] = "day"
final_df.head(1)


# Step 7:  
# Output file

# In[198]:


final_df.to_file(r"./nyt_counties_data.geojson", driver='GeoJSON', encoding='utf-8')
print("done")


# In[199]:


# illinois_gdf = final_df[final_df['state_name'] == 'Illinois']


# In[200]:


# illinois_gdf.to_file(r"./illinois/nyt_illinois_counties_data.geojson", driver='GeoJSON', encoding='utf-8')
# print('done')


# New Data Structure (Full version)

# In[201]:


# pivot_counties.columns = ['_'.join(col).strip() for col in pivot_counties.columns.values]
# report_df_2 = pivot_counties.reset_index()


# In[202]:


# report_df_2.head(5)


# In[203]:


# pivot_counties.head(5)


# In[204]:


# final_df_2 = pd.merge(old_counties_geojson_df[["NAME", "state_name", "population", "geometry"]], report_df_2, how='right', left_on=['NAME','state_name'], right_on = ['county','state'])
# final_df_2 = final_df_2.drop(['state','county'], axis = 1)
# final_df_2['dt_start'] = dt_start
# final_df_2['dt_end'] = dt_end
# final_df_2.head(5)


# In[205]:


# final_df_2.to_file(r"./nyt_counties_data_full.geojson", driver='GeoJSON', encoding='utf-8')
# print("done")


# Generate JSON file

# In[206]:


# county_list = []
# for state in df_counties_original.state.unique():
#     for county in df_counties_original.loc[(df_counties_original['state'] == state)].county.unique():
#         county_list.append({"name": county, "state": state})
 
# print(len(county_list), county_list)


# In[207]:


# data_df = report_df.set_index(report_df["county"]+", "+report_df["state"])
# data_dict =data_df.to_dict(orient='index')


# In[208]:


# df = df_counties_original.groupby(['county', 'state'], sort=False)[['cases', 'deaths']].max().sort_values("cases", ascending=False)
# county_state_list = list(map(lambda x: x[0]+", "+x[1], df.index.tolist()))
# meta = {"dates": dt_range_str,"states": county_state_list, "cases": df["cases"].values.tolist(), "deaths": df["deaths"].values.tolist()}
# data_dict["metadata"] = meta


# In[209]:


# data_dict


# In[210]:


# import json
# with open('./nyt_counties_data.json', 'w') as outfile:
#     json.dump(data_dict, outfile)


# In[ ]:




