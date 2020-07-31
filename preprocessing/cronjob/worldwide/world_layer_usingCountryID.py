#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd
import numpy as np
from datetime import datetime
import pytz
import geopandas as gpd
import mapclassify as mc


# Step0:  
# Read Data and get basic county groups

# 0.0 Report Data

# In[2]:


# df_world_original = pd.read_csv("WHO-COVID-19-global-data.csv")
# df_world_original


# In[3]:


import json
with open("global-covid19-who-gis.json") as f:
    df_world = json.load(f)
df_world_original = pd.DataFrame(df_world['rows'], columns = ['Date_reported','Country_code','WHO_region',
                                                              'New_deaths','Cumulative_deaths','New_cases',
                                                              'Cumulative_cases'])
df_world_original


# In[4]:


def time_conversion(in_time):
    out_time = datetime.fromtimestamp(int(in_time)/1000,pytz.utc) # using the UTC timezone
    return out_time.strftime("%Y-%m-%dT%H:%M:%SZ")
df_world_original['Date_reported']=df_world_original['Date_reported'].apply(time_conversion)
df_world_original


# In[5]:


df_world_original[df_world_original['Date_reported']=='2020-05-29T00:00:00Z']['Cumulative_cases'].sum()


# In[6]:


df_world_original[df_world_original['Date_reported']=='2020-05-29T00:00:00Z']['Cumulative_deaths'].sum()


# In[7]:


# df_world_original.loc[df_world_original['Country']=='Namibia','Country_code'] = 'NA'
# df_world_original[df_world_original['Country']=='Namibia']


# In[8]:


df_world_original[df_world_original['Country_code'].isna()==True]


# In[9]:


df_world_original = df_world_original.drop(columns=['WHO_region','New_cases','New_deaths'])
df_world_original


# In[10]:


df_world_original = df_world_original.rename(columns={"Date_reported": "date", "Country_code": "country_code", 
                                                      "Cumulative_cases": "cases", "Cumulative_deaths": "deaths"})
df_world_original


# In[11]:


type(df_world_original.loc[0,'date'])


# In[12]:


df_world_original['date'] = df_world_original['date'].str[0:10]
df_world_original


# In[13]:


df_world_original.head(30)


# 0.1 GeoJSON Data

# In[14]:


old_world_geojson_df = gpd.read_file("World_Countries_Boundaries_new.geojson")
old_world_geojson_df


# In[15]:


old_world_geojson_df = old_world_geojson_df[['ISO_2DIGIT','NAME','geometry']]
old_world_geojson_df


# In[16]:


#Add Kosovo geometry
import shapely.wkt
polygon1 = shapely.wkt.loads('POLYGON ((21.160269147746988 42.66353984291385, 21.160269147746988 42.6571648755645, 21.169109708660073 42.6571648755645, 21.169109708660073 42.66353984291385, 21.160269147746988 42.66353984291385))')
old_world_geojson_df = old_world_geojson_df.append({'ISO_2DIGIT':'XK', 'NAME':'Kosovo', 'geometry': polygon1}, ignore_index=True)


# In[17]:


#Add OTHERS geometry
import shapely.wkt
polygon2 = shapely.wkt.loads('POLYGON ((6.124162972753766 46.22138299367113, 6.124162972753766 46.20594098233243, 6.1473372586424375 46.20594098233243, 6.1473372586424375 46.22138299367113, 6.124162972753766 46.22138299367113))')
old_world_geojson_df = old_world_geojson_df.append({'ISO_2DIGIT':'Other*', 'NAME':'Others', 'geometry': polygon2}, ignore_index=True)


# In[18]:


old_world_geojson_df


# In[19]:


list(set(df_world_original['country_code'].unique())-set(old_world_geojson_df['ISO_2DIGIT'].unique()))


# Group Data to world

# In[20]:


pivot_world = pd.pivot_table(df_world_original , index=['country_code'], columns=['date'])
pivot_world = pivot_world.replace(np.nan, 0)
pivot_world


# 0.3 Get Date Info

# In[21]:


date= pivot_world['cases'].columns
date


# In[22]:


date_str = np.sort(date)
dt_str_start=np.min(date_str)
dt_str_end=np.max(date_str)


# In[23]:


dt_start = datetime.strptime(dt_str_start, "%Y-%m-%d")
dt_end = datetime.strptime(dt_str_end, "%Y-%m-%d")
dt_range = pd.date_range(start=dt_start,end=dt_end)
print(len(dt_range), dt_range)
dt_range_str = list(map(lambda x: x.strftime("%Y-%m-%d"), dt_range.tolist()))
print(len(dt_range_str), dt_range_str)


# Step1:  
# Add Cases Time Series, First Case Date, Death Time Series, First Death Date

# In[24]:


# import json
# pivot_world['cases_ts'] = json.dumps({"values": pivot_world['cases'].values.tolist()[0]})
# pivot_world['deaths_ts'] =  json.dumps({"values": pivot_world['deaths'].values.tolist()[0]})

pivot_world['cases_ts'] =  pivot_world['cases'].values.tolist()
pivot_world['deaths_ts'] =  pivot_world['deaths'].values.tolist()


# In[25]:


pivot_world['dt_first_case'] = (pivot_world['cases'] > 0).idxmax(axis=1)
pivot_world['dt_first_death'] = (pivot_world['deaths'] > 0).idxmax(axis=1)
#For death reports, deal with no deaths world
pivot_world.loc[pivot_world['deaths'].iloc[:, -1] <= 0, 'dt_first_death'] = np.nan
pivot_world.head(5)


# Step2:  
# Add today_case, today_new_case, today_death, today_new_death

# In[26]:


yesterday = date.values[-2]
day_before_yes = date.values[-3]
pivot_world['yesterday_case'] = pivot_world['cases'][yesterday]
pivot_world['yesterday_new_case'] = pivot_world['cases'][yesterday] - pivot_world['cases'][day_before_yes]
pivot_world['yesterday_death'] = pivot_world['deaths'][yesterday]
pivot_world['yesterday_new_death'] = pivot_world['deaths'][yesterday] - pivot_world['deaths'][day_before_yes]
pivot_world['today_case'] = pivot_world['cases'][dt_str_end]
pivot_world['today_new_case'] = pivot_world['cases'][dt_str_end] - pivot_world['cases'][yesterday]
pivot_world['today_death'] = pivot_world['deaths'][dt_str_end]
pivot_world['today_new_death'] = pivot_world['deaths'][dt_str_end] - pivot_world['deaths'][yesterday]


# Step3:  
# Extract necessary columns

# In[27]:


report_df = pivot_world[['cases_ts','deaths_ts','dt_first_case','dt_first_death','today_case','today_new_case', 'today_death','today_new_death','yesterday_case','yesterday_new_case','yesterday_death','yesterday_new_death']]
report_df = report_df.reset_index()
report_df.columns = ['country_code','cases_ts','deaths_ts','dt_first_case','dt_first_death','today_case','today_new_case', 'today_death','today_new_death','yesterday_case','yesterday_new_case','yesterday_death','yesterday_new_death']
report_df.head(5)


# Step4:  
# Assign Geometries to world

# In[28]:


final_df = pd.merge(old_world_geojson_df, report_df, how='left', left_on=['ISO_2DIGIT'], right_on = ['country_code'])
final_df.columns


# In[29]:


final_df


# Step5:  
# Deal with nan values (world not shows up in geojson) (More works)

# In[30]:


final_df[['today_case','today_new_case','today_death','today_new_death','yesterday_case','yesterday_new_case','yesterday_death','yesterday_new_death']] = final_df[['today_case','today_new_case','today_death','today_new_death','yesterday_case','yesterday_new_case','yesterday_death','yesterday_new_death']].replace(np.nan,0)


# In[31]:


template =final_df[~final_df['cases_ts'].isna()]['cases_ts']
template = template.iloc[0]


# In[32]:


for x in range(0,len(template)):
    template[x] = 0
template = ','.join(map(str, template))


# In[33]:


final_df['cases_ts'] = final_df['cases_ts'].apply(lambda x: ','.join(map(str, x)) if type(x) is list else template)
final_df['deaths_ts'] = final_df['deaths_ts'].apply(lambda x: ','.join(map(str, x)) if type(x) is list else template)
final_df.head(5)


# In[34]:


final_df


# In[35]:


print(final_df['ISO_2DIGIT'].value_counts().head(10))


# In[36]:


final_df['ISO_2DIGIT']


# In[37]:


final_df['ISO_2DIGIT'].value_counts()


# Step6:  
# Finalize the Dataframe

# In[38]:


final_df['dt_start'] = dt_str_start
final_df['dt_end'] = dt_str_end
final_df['dt_unit'] = "day"
final_df['population'] = 0
final_df.head(1)


# Step 7:  
# Output file

# In[39]:


final_df['geometry'] = final_df.apply(lambda x: shapely.wkt.loads(shapely.wkt.dumps(x.geometry, rounding_precision=8)).simplify(0), axis = 1)


# In[40]:


final_df.to_file("who_world_data.geojson", driver='GeoJSON', encoding='utf-8')
print("done")

