#!/usr/bin/env python
# coding: utf-8

# URL preparation

# In[89]:


# Geometry URL
zipcode_geometry_url = "http://www.dph.illinois.gov/sites/default/files/COVID19/il_illinois_zip_codes.json?nocache=1"
county_geometry_url = "http://www.dph.illinois.gov/sites/default/files/Illinois_County_Geo_ch.json"


# In[90]:


import pandas as pd
import json
import numpy as np
import geopandas as gpd
from urllib.request import urlopen
import shapely.wkt


# Download data

# In[91]:


with open("./idph_COVIDZip.json") as f:
    zipcode_dict = json.load(f)
    zipcode_data = pd.DataFrame(zipcode_dict['zip_values'])


# In[92]:


with open("./idph_COVIDHistoricalTestResults.json") as f:
    history_dict = json.load(f)


# In[93]:


zipcode_geometry = gpd.read_file(zipcode_geometry_url)
county_geometry = gpd.read_file(county_geometry_url)


# In[94]:


with urlopen(zipcode_geometry_url) as response:
    tmp = json.load(response)
    zipcode_gpd = gpd.GeoDataFrame(tmp['features'])


# In[95]:


zipcode_gpd['geometry'] = zipcode_geometry
zipcode_gpd = zipcode_gpd[['id','geometry']]
zipcode_gpd['id'] = zipcode_gpd['id'].astype(str)


# In[96]:


county_geometry


# In[97]:


county_gpd = county_geometry[['id','geometry']]


# In[98]:


polygon1 = shapely.wkt.loads('POLYGON ((-89.6536529004544 39.7828177522233, -89.6536529004544 39.7799814663649, -89.64987635016143 39.7799814663649, -89.64987635016143 39.7828177522233, -89.6536529004544 39.7828177522233))')
polygon2 = shapely.wkt.loads('POLYGON ((-89.64923261999786 39.78268583454302, -89.64923261999786 39.7799814663649, -89.64575647711456 39.7799814663649, -89.64575647711456 39.78268583454302, -89.64923261999786 39.78268583454302))')


# In[99]:


# county_gpd_dynamic = county_gpd.append([{'id':"Out Of State", 'geometry':polygon1}], ignore_index=True)
# county_gpd_dynamic = county_gpd_dynamic.append([{'id':"Unassigned", 'geometry':polygon2}], ignore_index=True)
county_gpd_dynamic = county_gpd.append([{'id':"Illinois", 'geometry':polygon2}], ignore_index=True)


# In[100]:


county_gpd_dynamic


# Zipcode Data generation

# In[101]:


zipcode_data


# In[102]:


zipcode_gpd.dtypes


# In[103]:


zipcode_final_gpd = pd.merge(zipcode_gpd,zipcode_data, how = 'left', left_on=['id'], right_on=['zip'])


# In[104]:


zipcode_final_gpd['confirmed_cases'] = zipcode_final_gpd['confirmed_cases'].replace(np.nan,0)
zipcode_final_gpd['total_tested'] = zipcode_final_gpd['total_tested'].replace(np.nan,0)
zipcode_final_gpd = zipcode_final_gpd[['id','confirmed_cases','total_tested','geometry']]


# In[105]:


zipcode_final_gpd.to_file('dph_zipcode_data.geojson', driver='GeoJSON', encoding='utf-8')
print('done')


# County Data generation
# 

# In[106]:


# transform to new york times format
county_history = pd.DataFrame(history_dict['historical_county']['values'])
l = []
for case in history_dict['historical_county']['values']:
    if 'testDate' in case:
        testDate = case['testDate']
    else:
        # Exception for 7/3/2020
        testDate = case['testdate']
    print(testDate)
    values = case['values']
    for x in values:
        x['date'] = testDate
        l.append(x)
county_history = pd.DataFrame(l)


# In[107]:


# eliminate unassigned data
county_history = county_history[county_history['County'] != 'Unassigned']


# In[108]:


def standardDate(str):
    l = str.split('/')
    month = l[0]
    day = l[1]
    year = l[2]
    if len(month) < 2:
        month = '0' + month
    if len(day) < 2:
        day = '0' + day
    return year + '-' + month + '-' + day


# In[109]:


# pivot table
county_pivot = pd.pivot_table(county_history, index=['County'],columns=['date'])
county_pivot = county_pivot.replace(np.nan, 0).astype(int)


# In[110]:


county_pivot['deaths'].iloc[2]


# In[111]:


# Standardized Date Format
county_cases = county_pivot['confirmed_cases']
county_deaths = county_pivot['deaths']
county_tested = county_pivot['total_tested']


# In[112]:


county_cases = county_cases.rename(columns=standardDate)
county_deaths = county_deaths.rename(columns=standardDate)
county_tested = county_tested.rename(columns=standardDate)


# In[113]:


# Add missing 03/23 data with 03/22
county_cases['2020-03-23'] = county_cases['2020-03-22']
county_deaths['2020-03-23'] = county_deaths['2020-03-22']
county_tested['2020-03-23'] = county_tested['2020-03-22']


# In[114]:


county_cases.head(1)


# In[115]:


county_tested


# In[116]:


# Get date information
date = county_cases.columns.tolist()
date.sort()
dt_first = date[0]
dt_today = date[-1]
dt_yesterday = date[-2]


# In[117]:


from datetime import datetime
from datetime import timedelta


# In[118]:


def find_missing_date(date):
    dt_range = datetime.strptime(date[-1], "%Y-%m-%d") - datetime.strptime(date[0], "%Y-%m-%d")
    if len(date) != dt_range.days + 1:
        print('Alert! Missing Date or Redundant date')
        for x in range(len(date) - 1):
            if (datetime.strptime(date[x + 1], "%Y-%m-%d") - datetime.strptime(date[x], "%Y-%m-%d")).days != 1:
                missing_date = datetime.strptime(date[x], "%Y-%m-%d") + timedelta(days=1)
                print('Missing Date:')
                print(missing_date)


# In[119]:


# Looking for missing dates
find_missing_date(date)


# In[120]:


# reorder date
county_cases = county_cases[date]
county_deaths = county_deaths[date]
county_tested = county_tested[date]


# In[121]:


# get case time series
cases_ts = county_cases.values.tolist()
deaths_ts = county_deaths.values.tolist()
tested_ts = county_tested.values.tolist()


# In[122]:


# get first case date
county_cases['dt_first_case'] = (county_cases > 0).idxmax(axis=1)
county_cases.loc[county_cases.iloc[:, -2] <= 0, 'dt_first_case'] = np.nan
county_deaths['dt_first_death'] = (county_deaths > 0).idxmax(axis=1)
county_deaths.loc[county_deaths.iloc[:, -2] <= 0, 'dt_first_death'] = np.nan


# In[123]:


county_cases['cases_ts'] = cases_ts
county_deaths['deaths_ts'] = deaths_ts


# In[124]:


# Add today_case and today_new_case columns
county_cases['today_case'] = county_cases[dt_today]
county_cases['today_new_case'] = county_cases[dt_today] - county_cases[dt_yesterday]
county_deaths['today_death'] = county_deaths[dt_today]
county_deaths['today_new_death'] = county_deaths[dt_today] - county_deaths[dt_yesterday]
county_tested['today_tested'] = county_tested[dt_today]
county_tested['today_new_tested'] = county_tested[dt_today] - county_tested[dt_yesterday]


# In[125]:


case_report = county_cases[['cases_ts','dt_first_case','today_case','today_new_case']]


# In[126]:


death_report = county_deaths[['deaths_ts','dt_first_death','today_death','today_new_death']]


# In[127]:


tested_report = county_tested[['today_tested','today_new_tested']]


# In[128]:


county_report = case_report.join(death_report, how="outer").join(tested_report, how="outer")


# In[129]:


county_report = county_report.reset_index()
county_report.columns = ['NAME','cases_ts','dt_first_case','today_case','today_new_case','deaths_ts','dt_first_death','today_death','today_new_death','today_tested','today_new_tested']
county_report['cases_ts'] = county_report['cases_ts'].apply(lambda x: ','.join(map(str,x)))
county_report['deaths_ts'] = county_report['deaths_ts'].apply(lambda x: ','.join(map(str,x)))


# In[130]:


np.setdiff1d(county_report['NAME'],county_gpd_dynamic['id'])
# Illinois, Out of State and Suburban Cook is not in geometry


# In[131]:


county_report = county_report[(county_report['NAME'] != 'Out Of State') & (county_report['NAME'] != 'Suburban Cook')]


# In[132]:


county_report['dt_start'] = dt_first
county_report['dt_end'] = dt_today
county_report['dt_unit'] = 'day'


# In[133]:


county_report


# In[134]:


county_final_gpd = pd.merge(county_gpd_dynamic, county_report, how="left", left_on="id", right_on="NAME")


# In[135]:


county_final_gpd['population'] = 1


# In[136]:


county_final_gpd


# In[137]:


county_final_gpd['geometry'] = county_final_gpd.apply(lambda x: shapely.wkt.loads(shapely.wkt.dumps(x.geometry, rounding_precision=8)).simplify(0), axis = 1)


# In[138]:


county_final_gpd.to_file('dph_county_data.geojson', driver='GeoJSON', encoding='utf-8')
print('done')

