#!/usr/bin/env python
# coding: utf-8

# In[37]:


import os
import glob
import shapely
import json
import numpy as np
import pandas as pd
import geopandas as gpd
import mapclassify as mc
from datetime import datetime
from datetime import timedelta
import matplotlib.pyplot as plt
import matplotlib.lines as mlines
from matplotlib.colors import ListedColormap


# In[38]:


modelFolderPath = "Accessibility_Dissolve_Animation"


# In[39]:


chicagoNameList = glob.glob(os.path.join(modelFolderPath,"Chicago_ACC.??-??-20??-*.shp"))
illinoisNameList = glob.glob(os.path.join(modelFolderPath,"Illinois_ACC.??-??-20??-*.shp"))
chicagoList = []
illinoisList = []

for i in range(0, len(chicagoNameList)):
    chicagoList.append(glob.glob(os.path.join(modelFolderPath,"Chicago_ACC.??-??-20??-*.shp"))[i][45:55])
for i in range(0, len(illinoisNameList)):
    illinoisList.append(glob.glob(os.path.join(modelFolderPath,"Illinois_ACC.??-??-20??-*.shp"))[i][46:56])
    
print(chicagoList)
print(illinoisList)


# In[40]:


def selectFirstDate(nameList):
    dmin = datetime.strptime(nameList[0], "%m-%d-%Y").date()
    index = 0
    for i in range(0, len(nameList)):
        d = datetime.strptime(nameList[i], "%m-%d-%Y").date()
        if (d<=dmin):
            index = i
            dmin = d
    return index

def selectLastDate(nameList):
    dmax = datetime.strptime(nameList[0], "%m-%d-%Y").date()
    index = 0
    for i in range(0, len(nameList)):
        d = datetime.strptime(nameList[i], "%m-%d-%Y").date()
        if (d>=dmax):
            index = i
            dmax = d
    return index


# In[41]:


firstIndex = selectFirstDate(chicagoList)
lastIndex = selectLastDate(chicagoList)
df = gpd.read_file(glob.glob(os.path.join(modelFolderPath,"Chicago_ACC."+chicagoList[lastIndex]+"*.shp"))[0])
nbArray_i = mc.NaturalBreaks(df['hospital_i'], k=6).bins.astype(float)

def classifyChicago(value):
    if value >= 0 and value <= nbArray_i[0]:
        return 0
    if value >= nbArray_i[0] and value <= nbArray_i[1]:
        return 1
    elif value > nbArray_i[1] and value <= nbArray_i[2]:
        return 2
    elif value > nbArray_i[2] and value <= nbArray_i[3]:
        return 3
    elif value > nbArray_i[3] and value <= nbArray_i[4]:
        return 4
    else:
        return 5

def classRangeChicago(value):
    if value == 0:
        return "0~"+str(round(nbArray_i[0],2))
    if value == 1:
        return str(round(nbArray_i[0],2))+"~"+str(round(nbArray_i[1],2))
    elif value == 2:
        return str(round(nbArray_i[1],2))+"~"+str(round(nbArray_i[2],2))
    elif value == 3:
        return str(round(nbArray_i[2],2))+"~"+str(round(nbArray_i[3],2))
    elif value == 4:
        return str(round(nbArray_i[3],2))+"~"+str(round(nbArray_i[4],2))
    else:
        return str(round(nbArray_i[4],2))+"~"+str(round(nbArray_i[5],2))

chicagoACC_dissolve_list = []    

for i in range(0, len(chicagoList)):
    #In case we have multiple files for one day
    if (i != 0):
        if (chicagoList[i] == chicagoList[i-1]):
            continue
    chicagoACC = gpd.read_file(glob.glob(os.path.join(modelFolderPath,"Chicago_ACC."+chicagoList[i]+"*.shp"))[0])
    #chicagoACC = chicagoACC.rename(columns={"normal_cov": "normal_val"})
    
    chicagoACC['category'] = chicagoACC.apply(lambda x: classifyChicago(x.hospital_i), axis = 1)
    chicagoACC_dissolve = chicagoACC.dissolve(by='category', aggfunc = 'mean')
    chicagoACC_dissolve = chicagoACC_dissolve.drop(columns=['id'])
    chicagoACC_dissolve = chicagoACC_dissolve.drop(columns=['hospital_v'])
    chicagoACC_dissolve["category"] = range(0, len(chicagoACC_dissolve))
    chicagoACC_dissolve['date'] = datetime.strptime(chicagoList[i], "%m-%d-%Y").date().strftime("%Y-%m-%d")
    chicagoACC_dissolve['range'] = chicagoACC_dissolve.apply(lambda x: classRangeChicago(x.category), axis = 1)
    
    chicagoACC_dissolve = chicagoACC_dissolve.to_crs({'init': 'epsg:4326'})
    #chicagoACC_dissolve.to_file("Chicago_ACC."+chicagoList[i]+"_dissolve.geojson", driver="GeoJSON")
    
    chicagoACC_dissolve_list.append(chicagoACC_dissolve)
    
chicagoACC_concat = pd.concat(chicagoACC_dissolve_list, axis=0)
chicagoACC_concat = chicagoACC_concat.drop(columns=['category'])
chicagoACC_concat = chicagoACC_concat.reset_index()

#delta = timedelta(days=len(chicagoList))
firstDate = datetime.strptime(chicagoList[firstIndex], "%m-%d-%Y").date()
lastDate = datetime.strptime(chicagoList[lastIndex], "%m-%d-%Y").date()
chicagoACC_concat["dt_start"] = firstDate.strftime("%Y-%m-%d") #(lastDate-delta).strftime("%Y-%m-%d")
chicagoACC_concat["dt_end"] = lastDate.strftime("%Y-%m-%d")
chicagoACC_concat["dt_unit"] = "day"
chicagoACC_concat["cases_ts"] = "0,0,0,0,0,0,0"#str(np.zeros(len(chicagoList),int)).replace(" ",",")
chicagoACC_concat['geometry'] = chicagoACC_concat.apply(lambda x: shapely.wkt.loads(shapely.wkt.dumps(x.geometry, rounding_precision=8)).simplify(0), axis = 1)
chicagoACC_concat.to_file("Chicago_ACC_i.geojson", driver="GeoJSON")

print("done")


# In[42]:


chicagoACC_concat


# In[43]:


firstIndex = selectFirstDate(chicagoList)
lastIndex = selectLastDate(chicagoList)
df = gpd.read_file(glob.glob(os.path.join(modelFolderPath,"Chicago_ACC."+chicagoList[lastIndex]+"*.shp"))[0])
nbArray_v = mc.NaturalBreaks(df['hospital_v'], k=6).bins.astype(float)

def classifyChicago(value):
    if value >= 0 and value <= nbArray_v[0]:
        return 0
    if value >= nbArray_v[0] and value <= nbArray_v[1]:
        return 1
    elif value > nbArray_v[1] and value <= nbArray_v[2]:
        return 2
    elif value > nbArray_v[2] and value <= nbArray_v[3]:
        return 3
    elif value > nbArray_v[3] and value <= nbArray_v[4]:
        return 4
    else:
        return 5

def classRangeChicago(value):
    if value == 0:
        return "0~"+str(round(nbArray_v[0],2))
    if value == 1:
        return str(round(nbArray_v[0],2))+"~"+str(round(nbArray_v[1],2))
    elif value == 2:
        return str(round(nbArray_v[1],2))+"~"+str(round(nbArray_v[2],2))
    elif value == 3:
        return str(round(nbArray_v[2],2))+"~"+str(round(nbArray_v[3],2))
    elif value == 4:
        return str(round(nbArray_v[3],2))+"~"+str(round(nbArray_v[4],2))
    else:
        return str(round(nbArray_v[4],2))+"~"+str(round(nbArray_v[5],2))

chicagoACC_dissolve_list = []    

for i in range(0, len(chicagoList)):
    #In case we have multiple files for one day
    if (i != 0):
        if (chicagoList[i] == chicagoList[i-1]):
            continue
    chicagoACC = gpd.read_file(glob.glob(os.path.join(modelFolderPath,"Chicago_ACC."+chicagoList[i]+"*.shp"))[0])
    #chicagoACC = chicagoACC.rename(columns={"normal_cov": "normal_val"})
    
    chicagoACC['category'] = chicagoACC.apply(lambda x: classifyChicago(x.hospital_v), axis = 1)
    chicagoACC_dissolve = chicagoACC.dissolve(by='category', aggfunc = 'mean')
    chicagoACC_dissolve = chicagoACC_dissolve.drop(columns=['id'])
    chicagoACC_dissolve = chicagoACC_dissolve.drop(columns=['hospital_i'])
    chicagoACC_dissolve["category"] = range(0, len(chicagoACC_dissolve))
    chicagoACC_dissolve['date'] = datetime.strptime(chicagoList[i], "%m-%d-%Y").date().strftime("%Y-%m-%d")
    chicagoACC_dissolve['range'] = chicagoACC_dissolve.apply(lambda x: classRangeChicago(x.category), axis = 1)
    
    chicagoACC_dissolve = chicagoACC_dissolve.to_crs({'init': 'epsg:4326'})
    #chicagoACC_dissolve.to_file("Chicago_ACC."+chicagoList[i]+"_dissolve.geojson", driver="GeoJSON")
    
    chicagoACC_dissolve_list.append(chicagoACC_dissolve)
    
chicagoACC_concat = pd.concat(chicagoACC_dissolve_list, axis=0)
chicagoACC_concat = chicagoACC_concat.drop(columns=['category'])
chicagoACC_concat = chicagoACC_concat.reset_index()

#delta = timedelta(days=len(chicagoList))
firstDate = datetime.strptime(chicagoList[firstIndex], "%m-%d-%Y").date()
lastDate = datetime.strptime(chicagoList[lastIndex], "%m-%d-%Y").date()
chicagoACC_concat["dt_start"] = firstDate.strftime("%Y-%m-%d") #(lastDate-delta).strftime("%Y-%m-%d")
chicagoACC_concat["dt_end"] = lastDate.strftime("%Y-%m-%d")
chicagoACC_concat["dt_unit"] = "day"
chicagoACC_concat["cases_ts"] = "0,0,0,0,0,0,0"#str(np.zeros(len(chicagoList),int)).replace(" ",",")
chicagoACC_concat['geometry'] = chicagoACC_concat.apply(lambda x: shapely.wkt.loads(shapely.wkt.dumps(x.geometry, rounding_precision=8)).simplify(0), axis = 1)
chicagoACC_concat.to_file("Chicago_ACC_v.geojson", driver="GeoJSON")

print("done")


# In[44]:


chicagoACC_concat


# In[45]:


firstIndex = selectFirstDate(illinoisList)
lastIndex = selectLastDate(illinoisList)
df = gpd.read_file(glob.glob(os.path.join(modelFolderPath,"Illinois_ACC."+illinoisList[lastIndex]+"*.shp"))[0])
nbArray_i = mc.NaturalBreaks(df['hospital_i'], k=6).bins.astype(float)

def classifyIllinois(value):   
    if value >= 0 and value <= nbArray_i[0]:
        return 0
    if value >= nbArray_i[0] and value <= nbArray_i[1]:
        return 1
    elif value > nbArray_i[1] and value <= nbArray_i[2]:
        return 2
    elif value > nbArray_i[2] and value <= nbArray_i[3]:
        return 3
    elif value > nbArray_i[3] and value <= nbArray_i[4]:
        return 4
    else:
        return 5
    
def classRangeIllinois(value):
    if value == 0:
        return "0~"+str(round(nbArray_i[0],2))
    if value == 1:
        return str(round(nbArray_i[0],2))+"~"+str(round(nbArray_i[1],2))
    elif value == 2:
        return str(round(nbArray_i[1],2))+"~"+str(round(nbArray_i[2],2))
    elif value == 3:
        return str(round(nbArray_i[2],2))+"~"+str(round(nbArray_i[3],2))
    elif value == 4:
        return str(round(nbArray_i[3],2))+"~"+str(round(nbArray_i[4],2))
    else:
        return str(round(nbArray_i[4],2))+"~"+str(round(nbArray_i[5],2))

illinoisACC_dissolve_list = []    

for i in range(0, len(illinoisList)):
    #In case we have multiple files for one day
    if (i != 0):
        if (illinoisList[i] == illinoisList[i-1]):
            continue
    illinoisACC = gpd.read_file(glob.glob(os.path.join(modelFolderPath,"Illinois_ACC."+illinoisList[i]+"*.shp"))[0])
    #illinoisACC = illinoisACC.rename(columns={"normal_cov": "normal_val"})
    
    illinoisACC['category'] = illinoisACC.apply(lambda x: classifyIllinois(x.hospital_i), axis = 1)
    illinoisACC_dissolve = illinoisACC.dissolve(by='category', aggfunc = 'mean')
    illinoisACC_dissolve = illinoisACC_dissolve.drop(columns=['id'])
    illinoisACC_dissolve = illinoisACC_dissolve.drop(columns=['hospital_v'])
    illinoisACC_dissolve["category"] = range(0, len(illinoisACC_dissolve))
    illinoisACC_dissolve['date'] = datetime.strptime(illinoisList[i], "%m-%d-%Y").date().strftime("%Y-%m-%d")
    illinoisACC_dissolve['range'] = illinoisACC_dissolve.apply(lambda x: classRangeIllinois(x.category), axis = 1)
    #illinoisACC_dissolve["category"] = range(0, len(illinoisACC_dissolve))
    
    illinoisACC_dissolve = illinoisACC_dissolve.to_crs({'init': 'epsg:4326'})
    #illinoisACC_dissolve.to_file("Illinois_ACC."+illinoisList[i]+"_dissolve.geojson", driver="GeoJSON")
    
    illinoisACC_dissolve_list.append(illinoisACC_dissolve)
    
illinoisACC_concat = pd.concat(illinoisACC_dissolve_list, axis=0)
illinoisACC_concat = illinoisACC_concat.drop(columns=['category'])
illinoisACC_concat = illinoisACC_concat.reset_index()

#delta = timedelta(days=len(illinoisList))
firstDate = datetime.strptime(illinoisList[firstIndex], "%m-%d-%Y").date()
lastDate = datetime.strptime(illinoisList[lastIndex], "%m-%d-%Y").date()
illinoisACC_concat["dt_start"] = firstDate.strftime("%Y-%m-%d") #(lastDate-delta).strftime("%Y-%m-%d")
illinoisACC_concat["dt_end"] = lastDate.strftime("%Y-%m-%d")
illinoisACC_concat["dt_unit"] = "day"
illinoisACC_concat["cases_ts"] = "0,0,0,0,0,0,0"#str(np.zeros(len(illinoisList),int)).replace(" ",",")
illinoisACC_concat['geometry'] = illinoisACC_concat.apply(lambda x: shapely.wkt.loads(shapely.wkt.dumps(x.geometry, rounding_precision=8)).simplify(0), axis = 1)
illinoisACC_concat.to_file("Illinois_ACC_i.geojson", driver="GeoJSON")

print("done")


# In[46]:


illinoisACC_concat


# In[47]:


firstIndex = selectFirstDate(illinoisList)
lastIndex = selectLastDate(illinoisList)
df = gpd.read_file(glob.glob(os.path.join(modelFolderPath,"Illinois_ACC."+illinoisList[lastIndex]+"*.shp"))[0])
nbArray_v = mc.NaturalBreaks(df['hospital_v'], k=6).bins.astype(float)

def classifyIllinois(value):   
    if value >= 0 and value <= nbArray_v[0]:
        return 0
    if value >= nbArray_v[0] and value <= nbArray_v[1]:
        return 1
    elif value > nbArray_v[1] and value <= nbArray_v[2]:
        return 2
    elif value > nbArray_v[2] and value <= nbArray_v[3]:
        return 3
    elif value > nbArray_v[3] and value <= nbArray_v[4]:
        return 4
    else:
        return 5
    
def classRangeIllinois(value):
    if value == 0:
        return "0~"+str(round(nbArray_v[0],2))
    if value == 1:
        return str(round(nbArray_v[0],2))+"~"+str(round(nbArray_v[1],2))
    elif value == 2:
        return str(round(nbArray_v[1],2))+"~"+str(round(nbArray_v[2],2))
    elif value == 3:
        return str(round(nbArray_v[2],2))+"~"+str(round(nbArray_v[3],2))
    elif value == 4:
        return str(round(nbArray_v[3],2))+"~"+str(round(nbArray_v[4],2))
    else:
        return str(round(nbArray_v[4],2))+"~"+str(round(nbArray_v[5],2))

illinoisACC_dissolve_list = []    

for i in range(0, len(illinoisList)):
    #In case we have multiple files for one day
    if (i != 0):
        if (illinoisList[i] == illinoisList[i-1]):
            continue
    illinoisACC = gpd.read_file(glob.glob(os.path.join(modelFolderPath,"Illinois_ACC."+illinoisList[i]+"*.shp"))[0])
    #illinoisACC = illinoisACC.rename(columns={"normal_cov": "normal_val"})
    
    illinoisACC['category'] = illinoisACC.apply(lambda x: classifyIllinois(x.hospital_v), axis = 1)
    illinoisACC_dissolve = illinoisACC.dissolve(by='category', aggfunc = 'mean')
    illinoisACC_dissolve = illinoisACC_dissolve.drop(columns=['id'])
    illinoisACC_dissolve = illinoisACC_dissolve.drop(columns=['hospital_i'])
    illinoisACC_dissolve["category"] = range(0, len(illinoisACC_dissolve))
    illinoisACC_dissolve['date'] = datetime.strptime(illinoisList[i], "%m-%d-%Y").date().strftime("%Y-%m-%d")
    illinoisACC_dissolve['range'] = illinoisACC_dissolve.apply(lambda x: classRangeIllinois(x.category), axis = 1)
    #illinoisACC_dissolve["category"] = range(0, len(illinoisACC_dissolve))
    
    illinoisACC_dissolve = illinoisACC_dissolve.to_crs({'init': 'epsg:4326'})
    #illinoisACC_dissolve.to_file("Illinois_ACC."+illinoisList[i]+"_dissolve.geojson", driver="GeoJSON")
    
    illinoisACC_dissolve_list.append(illinoisACC_dissolve)
    
illinoisACC_concat = pd.concat(illinoisACC_dissolve_list, axis=0)
illinoisACC_concat = illinoisACC_concat.drop(columns=['category'])
illinoisACC_concat = illinoisACC_concat.reset_index()

#delta = timedelta(days=len(illinoisList))
firstDate = datetime.strptime(illinoisList[firstIndex], "%m-%d-%Y").date()
lastDate = datetime.strptime(illinoisList[lastIndex], "%m-%d-%Y").date()
illinoisACC_concat["dt_start"] = firstDate.strftime("%Y-%m-%d") #(lastDate-delta).strftime("%Y-%m-%d")
illinoisACC_concat["dt_end"] = lastDate.strftime("%Y-%m-%d")
illinoisACC_concat["dt_unit"] = "day"
illinoisACC_concat["cases_ts"] = "0,0,0,0,0,0,0"#str(np.zeros(len(illinoisList),int)).replace(" ",",")
illinoisACC_concat['geometry'] = illinoisACC_concat.apply(lambda x: shapely.wkt.loads(shapely.wkt.dumps(x.geometry, rounding_precision=8)).simplify(0), axis = 1)

illinoisACC_concat.to_file("Illinois_ACC_v.geojson", driver="GeoJSON")

print("done")


# In[48]:




illinoisACC_concat

