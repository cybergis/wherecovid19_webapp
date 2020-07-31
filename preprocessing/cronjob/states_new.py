#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd
import numpy as np
from datetime import datetime
import geopandas as gpd


# In[2]:


df_states_original = pd.read_csv("./us-states.csv", dtype={"date": np.string_,
                                                             "state": np.string_,
                                                             "fips": np.string_,
                                                            "cases": np.int32,
                                                            "deaths": np.int32})
df_states_original.sort_values("fips", ascending=True)
# #Replaces any nan to 0
# if df_states_original.isnull().values.any():
#     df_states_original.replace(np.nan, None)


# In[3]:


pivot_states = pd.pivot_table(df_states_original , index=['state','fips'],
                       columns=['date'])
if pivot_states.isnull().values.any():
    pivot_states = pivot_states.replace(np.nan, 0).astype(int)
pivot_states.head(5)


# Get Date Info

# In[4]:


date= pivot_states['cases'].columns
date


# In[5]:


date_str = np.sort(date)
dt_str_start=np.min(date_str)
dt_str_end=np.max(date_str)


# In[6]:


dt_start = datetime.strptime(dt_str_start, "%Y-%m-%d")
dt_end = datetime.strptime(dt_str_end, "%Y-%m-%d")
dt_range = pd.date_range(start=dt_start,end=dt_end)
print(len(dt_range), dt_range)
dt_range_str = list(map(lambda x: x.strftime("%Y-%m-%d"), dt_range.tolist()))
print(len(dt_range_str), dt_range_str)


# Add Cases Time Series, First Case Date, Death Time Series, First Death Date

# In[7]:


# import json
# pivot_states['cases_ts'] = "'" + json.dumps({"values": pivot_states['cases'].values.tolist()[0]}) + "'"
# pivot_states['deaths_ts'] = "'" + json.dumps({"values": pivot_states['deaths'].values.tolist()[0]}) + "'"

pivot_states['cases_ts'] = pivot_states['cases'].values.tolist()
pivot_states['cases_ts'] = pivot_states['cases_ts'].apply(lambda x: ','.join(map(str, x)))
pivot_states['deaths_ts'] = pivot_states['deaths'].values.tolist()
pivot_states['deaths_ts'] = pivot_states['deaths_ts'].apply(lambda x: ','.join(map(str, x)))


# In[8]:


yesterday = date.values[-2]
pivot_states['today_case'] = pivot_states['cases'][dt_str_end]
pivot_states['today_new_case'] = pivot_states['cases'][dt_str_end] - pivot_states['cases'][yesterday]
pivot_states['today_death'] = pivot_states['deaths'][dt_str_end]
pivot_states['today_new_death'] = pivot_states['deaths'][dt_str_end] - pivot_states['deaths'][yesterday]


# In[9]:


pivot_states['dt_first_case'] = (pivot_states['cases'] > 0).idxmax(axis=1)
pivot_states['dt_first_death'] = (pivot_states['deaths'] > 0).idxmax(axis=1)
#For death reports, deal with no deaths counties
pivot_states.loc[pivot_states['deaths'].iloc[:, -1] <= 0, 'dt_first_death'] = np.nan
pivot_states.head(5)


# In[10]:


pivot_states['today_case'].sum()


# Read County Boundary GeoJSON file

# In[11]:


old_states_geojson_df = gpd.read_file(r"./states_update.geojson")
old_states_geojson_df.head(5)


# In[12]:


old_states_geojson_df[['NAME','population','GEOID','geometry']]


# Old Data Structure

# In[13]:


report_df = pivot_states[['cases_ts','deaths_ts','dt_first_case','dt_first_death','today_case','today_new_case', 'today_death','today_new_death']]
report_df = report_df.reset_index()
report_df.columns = ['state','fips','cases_ts','deaths_ts','dt_first_case','dt_first_death','today_case','today_new_case', 'today_death','today_new_death']
report_df.head(5)


# In[14]:


report_df['state']


# In[15]:


report_df['today_case'].sum()
#truth value: 528405


# In[16]:


#Stay consistency with geojson states
report_df = report_df.replace('Northern Mariana Islands','Commonwealth of the Northern Mariana Islands')


# In[17]:


final_df = pd.merge(old_states_geojson_df[["NAME", "population", "geometry"]], report_df, how='left', left_on=['NAME'], right_on = ['state'])
final_df.columns


# In[18]:


final_df['NAME']


# In[19]:


final_df=final_df[["NAME", "population", "fips", "dt_first_case", "dt_first_death", "cases_ts", "deaths_ts", 'today_case','today_new_case', 'today_death','today_new_death', "geometry"]]
final_df['dt_start'] = dt_str_start
final_df['dt_end'] = dt_str_end
final_df['dt_unit'] = "day"
final_df.head(5)


# In[20]:


final_df['today_case'].sum()
# result: 528405, same as truth


# In[21]:


#New York Times remove Samoa data since 4/27
final_df = final_df.drop(final_df[final_df['NAME'] == 'American Samoa'].index)


# In[22]:


final_df.to_file(r"./nyt_states_data.geojson", driver='GeoJSON', encoding='utf-8')
print("done")


# New Data Structure (Full version)

# In[23]:


# pivot_states.columns = ['_'.join(col).strip() for col in pivot_states.columns.values]
# report_df_2 = pivot_states.reset_index()


# In[24]:


# report_df_2.head(5)


# In[25]:


# pivot_states.head(5)


# In[26]:


# final_df_2 = pd.merge(old_states_geojson_df[["NAME", "population", "geometry"]], report_df_2, how='right', left_on=['NAME'], right_on = ['state'])
# final_df_2 = final_df_2.drop(['state'], axis = 1)
# final_df_2['dt_start'] = dt_start
# final_df_2['dt_end'] = dt_end
# final_df_2.head(5)


# In[27]:


# final_df_2.to_file(r"./nyt_states_data_full.geojson", driver='GeoJSON', encoding='utf-8')
# print("done")

