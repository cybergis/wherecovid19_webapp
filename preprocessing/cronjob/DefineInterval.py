#!/usr/bin/env python
# coding: utf-8

# In[227]:


import geopandas as gpd
import numpy as np
import mapclassify as mc
import matplotlib.pyplot as plt


# In[228]:


total_dict = {}
county_dict = {}
state_dict = {}
dph_illinois_dict = {}
who_world_dict = {}
vul_dict = {}


# In[229]:


dynamic_dict = {}
dynamic_county_dict = {}
dynamic_state_dict = {}
dynamic_illinois_dict = {}


# 1. Read County Data

# In[230]:


counties_gdf = gpd.read_file('nyt_counties_data.geojson')


# In[231]:


counties_gdf.head(5)


# In[232]:


case = counties_gdf['today_case']
death = counties_gdf['today_death']
case_per_100k_capita = counties_gdf['today_case']/(counties_gdf['population']/100000)
death_per_100k_capita = counties_gdf['today_death']/(counties_gdf['population']/100000)
# death_case_ratio = counties_gdf['today_death']/counties_gdf['today_case']
# death_case_ratio = death_case_ratio.replace(np.nan, 0)


# In[233]:


log_case = case.apply(lambda x: np.log(x + 1))
log_death = death.apply(lambda x: np.log(x + 1))
log_case_per_100k_capita = case_per_100k_capita.apply(lambda x: np.log(x + 1))
log_death_per_100k_capita = death.apply(lambda x: np.log(x + 1))


# 1.1 Get Constant Classes from today's data

# In[234]:


def create_dict(column):
    tmp_dict = {}
    tmp_dict['Quantiles'] = {
        'bins': ','.join(mc.Quantiles(column, k=6).bins.astype(str)),
        'k': 6
    }
    tmp_dict['FisherJenks'] = {
        'bins': ','.join(mc.FisherJenks(column, k=6).bins.astype(str)),
        'k': 6
    }
    tmp_dict['NaturalBreaks'] = {
        'bins': ','.join(mc.NaturalBreaks(column, k=6).bins.astype(str)),
        'k': 6
    }
    return tmp_dict


# In[235]:


county_dict['case'] = {}
county_dict['death'] = {}
county_dict['case_per_100k_capita'] = {}
county_dict['death_per_100k_capita'] = {}


# In[236]:


county_dict['case']['nolog'] = create_dict(case)
county_dict['case']['log'] = create_dict(log_case)
county_dict['death']['nolog'] = create_dict(death)
county_dict['death']['log'] = create_dict(log_death)
county_dict['case_per_100k_capita']['nolog'] = create_dict(case_per_100k_capita)
county_dict['case_per_100k_capita']['log'] = create_dict(log_case_per_100k_capita)
county_dict['death_per_100k_capita']['nolog'] = create_dict(death_per_100k_capita)
county_dict['death_per_100k_capita']['log'] = create_dict(log_death_per_100k_capita)


# In[237]:


county_dict


# 1.2 Create Dynamic classes

# In[238]:


# case_ts = counties_gdf['cases_ts'].apply(lambda x: x.split(','))
# death_ts = counties_gdf['deaths_ts'].apply(lambda x: x.split(','))


# In[239]:


# length = len(case_ts[1])


# In[240]:


# new_case_dict = {}
# for i in range(1,length):
#     q6 = mc.Quantiles(case_ts.apply(lambda x: int(float(x[i]) - float(x[i - 1]))).values, k=6)
#     new_case_dict[i] = ','.join(q6.bins.astype(int).astype(str))


# In[241]:


# new_death_dict = {}
# for i in range(1,length):
#     d6 = mc.Quantiles(death_ts.apply(lambda x: int(float(x[i]) - float(x[i - 1]))).values, k=6)
#     new_death_dict[i] = ','.join(d6.bins.astype(int).astype(str))


# In[242]:


# dynamic_county_dict['new_case'] = new_case_dict
# dynamic_county_dict['new_death'] = new_death_dict


# 2.Read State Data

# In[243]:


state_gdf = gpd.read_file('nyt_states_data.geojson')


# In[244]:


state_gdf.head(5)


# In[245]:


state_gdf.iloc[34]


# In[246]:


state_case = state_gdf['today_case']
state_death = state_gdf['today_death']
state_case_per_100k_capita = state_gdf['today_case']/(state_gdf['population']/100000)
state_death_per_100k_capita = state_gdf['today_death']/(state_gdf['population']/100000)
#death_case_ratio = counties_gdf['today_death']/counties_gdf['today_case']
#death_case_ratio = death_case_ratio.replace(np.nan, 0)


# In[247]:


state_death_per_100k_capita = state_death_per_100k_capita.replace(np.nan,0)
state_death_per_100k_capita = state_death_per_100k_capita.replace(np.inf,0)
state_case_per_100k_capita = state_case_per_100k_capita.replace(np.nan,0)
state_case_per_100k_capita = state_case_per_100k_capita.replace(np.inf,0)


# In[248]:


state_log_case = state_case.apply(lambda x: np.log(x + 1))
state_log_death = state_death.apply(lambda x: np.log(x + 1))
state_log_case_per_100k_capita = state_case_per_100k_capita.apply(lambda x: np.log(x + 1))
state_log_death_per_100k_capita =state_death_per_100k_capita.apply(lambda x: np.log(x + 1))


# In[249]:


state_dict['case'] = {}
state_dict['death'] = {}
state_dict['case_per_100k_capita'] = {}
state_dict['death_per_100k_capita'] = {}


# In[250]:


state_dict['case']['nolog'] = create_dict(state_case)
state_dict['case']['log'] = create_dict(state_log_case)
state_dict['death']['nolog'] = create_dict(state_death)
state_dict['death']['log'] = create_dict(state_log_death)
state_dict['case_per_100k_capita']['nolog'] = create_dict(state_case_per_100k_capita)
state_dict['case_per_100k_capita']['log'] = create_dict(state_log_case_per_100k_capita)
state_dict['death_per_100k_capita']['nolog'] = create_dict(state_death_per_100k_capita)
state_dict['death_per_100k_capita']['log'] = create_dict(state_log_death_per_100k_capita)


# 4. Read DPH Illinois County Data

# In[251]:


dph_illinois_gdf = gpd.read_file('illinois/dph_county_data.geojson')


# In[252]:


dph_illinois_gdf.head(5)


# In[253]:


dph_illinois_gdf = dph_illinois_gdf[dph_illinois_gdf['id'] != 'Illinois']


# In[254]:


dph_illinois_case = dph_illinois_gdf['today_case']

#illinois_case_per_100k_capita = illinois_gdf['today_case']/(illinois_gdf['population']/100000)
#illinois_death_per_100k_capita = illinois_gdf['today_death']/(illinois_gdf['population']/100000)
#death_case_ratio = counties_gdf['today_death']/counties_gdf['today_case']
#death_case_ratio = death_case_ratio.replace(np.nan, 0)


# In[255]:


# illinois_death_per_100k_capita = illinois_death_per_100k_capita.replace(np.nan,0)
# illinois_death_per_100k_capita = illinois_death_per_100k_capita.replace(np.inf,0)
# illinois_case_per_100k_capita = illinois_case_per_100k_capita.replace(np.nan,0)
# illinois_case_per_100k_capita = illinois_case_per_100k_capita.replace(np.inf,0)


# In[256]:


dph_illinois_log_case = dph_illinois_case.apply(lambda x: np.log(x + 1))
# illinois_log_death = illinois_death.apply(lambda x: np.log(x + 1))
# illinois_log_case_per_100k_capita = illinois_case_per_100k_capita.apply(lambda x: np.log(x + 1))
# illinois_log_death_per_100k_capita =illinois_death_per_100k_capita.apply(lambda x: np.log(x + 1))


# In[257]:


dph_illinois_dict['case'] = {}
dph_illinois_dict['death'] = {}
dph_illinois_dict['case_per_100k_capita'] = {}
dph_illinois_dict['death_per_100k_capita'] = {}


# In[258]:


dph_illinois_dict['case']['nolog'] = create_dict(dph_illinois_case)
dph_illinois_dict['case']['log'] = create_dict(dph_illinois_log_case)
# dph_illinois_dict['death']['nolog'] = create_dict(illinois_death)
# dph_illinois_dict['death']['log'] = create_dict(illinois_log_death)
# dph_illinois_dict['case_per_100k_capita']['nolog'] = create_dict(illinois_case_per_100k_capita)
# dph_illinois_dict['case_per_100k_capita']['log'] = create_dict(illinois_log_case_per_100k_capita)
# dph_illinois_dict['death_per_100k_capita']['nolog'] = create_dict(illinois_death_per_100k_capita)
# dph_illinois_dict['death_per_100k_capita']['log'] = create_dict(illinois_log_death_per_100k_capita)


# 6. Read DPH County Test (Static) and DPH Zipcode Case (Static)
# 

# In[259]:


dph_illinois_test_gdf = gpd.read_file('illinois/dph_county_static_data.geojson')
dph_zipcode_gdf = gpd.read_file('illinois/dph_zipcode_data.geojson')


# In[260]:


dph_illinois_test_gdf = dph_illinois_test_gdf[dph_illinois_test_gdf['NAME'] != 'Illinois']


# In[261]:


dph_zipcode_gdf


# In[262]:


dph_illinois_tested = dph_illinois_test_gdf['total_tested']
dph_zipcode_tested = dph_zipcode_gdf['total_tested']
dph_zipcode_case = dph_zipcode_gdf['confirmed_cases']


# In[263]:


dph_illinois_log_tested = dph_illinois_tested.apply(lambda x: np.log(x + 1))
dph_zipcode_log_tested = dph_zipcode_tested.apply(lambda x: np.log(x + 1))
dph_zipcode_log_case = dph_zipcode_case.apply(lambda x: np.log(x + 1))


# In[264]:


dph_illinois_dict['tested'] = {}
dph_illinois_dict['zipcode_case'] = {}
dph_illinois_dict['zipcode_tested'] = {}


# In[265]:


dph_illinois_dict['tested']['nolog'] = create_dict(dph_illinois_tested)
dph_illinois_dict['tested']['log'] = create_dict(dph_illinois_log_tested)
dph_illinois_dict['zipcode_case']['nolog'] = create_dict(dph_zipcode_case)
dph_illinois_dict['zipcode_case']['log'] = create_dict(dph_zipcode_log_case)
dph_illinois_dict['zipcode_tested']['nolog'] = create_dict(dph_zipcode_tested)
dph_illinois_dict['zipcode_tested']['log'] = create_dict(dph_zipcode_log_tested)


# 7. Read Worldwide Data

# In[266]:


who_world_gdf = gpd.read_file('worldwide/who_world_data.geojson')


# In[267]:


who_world_case = who_world_gdf['today_case']
who_world_death = who_world_gdf['today_death']


# In[268]:


who_world_log_case = who_world_case.apply(lambda x: np.log(x + 1))
who_world_log_death = who_world_death.apply(lambda x: np.log(x + 1))


# In[269]:


who_world_dict['case'] = {}
who_world_dict['death'] = {}


# In[270]:


who_world_dict['case']['nolog'] = create_dict(who_world_case)
who_world_dict['case']['log'] = create_dict(who_world_log_case)
who_world_dict['death']['nolog'] = create_dict(who_world_death)
who_world_dict['death']['log'] = create_dict(who_world_log_death)


# 8. Read Vulnerability Data

# In[271]:


vul_gdf = gpd.read_file('illinois/vulnerability.geojson')


# In[272]:


vul = vul_gdf['today_vul']


# In[273]:


vul_dict['case'] = {}


# In[274]:


vul_dict['case']['nolog'] = create_dict(vul)


# Summary and ouput
# 

# In[275]:


import json
total_dict['county'] = county_dict
total_dict['state'] = state_dict
total_dict['dph_illinois'] = dph_illinois_dict
total_dict['who_world'] = who_world_dict
total_dict['vulnerability'] = vul_dict
# dynamic_dict['county'] = dynamic_county_dict
# dynamic_dict['state'] = dynamic_state_dict
# dynamic_dict['illinois'] = dynamic_illinois_dict
with open('classes.json','w') as json_file:
    json.dump(total_dict, json_file)
# with open('dynamic_classes.json','w') as json_file:
#     json.dump(dynamic_dict, json_file)
print('done')

