import ee
from ee.ee_exception import EEException
import time
import datetime

try:
    ee.Initialize()
except EEException as e:
    from oauth2client.service_account import ServiceAccountCredentials
    credentials = ServiceAccountCredentials.from_p12_keyfile(
    service_account_email='',
    filename='',
    private_key_password='notasecret',
    scopes=ee.oauth.SCOPE + ' https://www.googleapis.com/auth/drive ')
    ee.Initialize(credentials)


def makeTimeSeries(collection,geometry,key=None):

    def reducerMapping(img):
        reduction = img.reduceRegion(
            ee.Reducer.mean(), geometry, 20000)

        time = img.get('system:time_start')

        return img.set('indexVal',[ee.Number(time),reduction.get(key)])

    collection = collection.filterBounds(geometry) #.getInfo()

    indexCollection = collection.map(reducerMapping)

    indexSeries = indexCollection.aggregate_array('indexVal').getInfo()

    formattedSeries = [[x[0],round(float(x[1]),3)] for x in indexSeries]

    days_with_data = [[datetime.datetime.fromtimestamp((int(x[0]) / 1000)).strftime('%Y %B %d'),round(float(x[1]),3)] for x in indexSeries if x[1] > 0 ]

    return sorted(formattedSeries)

def modis_comp(aoi, date1, date2):

    mod43 = ee.ImageCollection("MODIS/006/MCD43A4").filterBounds(aoi).filterDate(date1, date2)
    b1 = mod43.select(['Nadir_Reflectance_Band3']).median().rename('b1')
    b2 = mod43.select(['Nadir_Reflectance_Band4']).median().rename('b2')
    b3 = mod43.select(['Nadir_Reflectance_Band1']).median().rename('b3')
    b4 = mod43.select(['Nadir_Reflectance_Band2']).median().rename('b4')
    b6 = mod43.select(['Nadir_Reflectance_Band6']).median().rename('b6')
    b7 = mod43.select(['Nadir_Reflectance_Band7']).median().rename('b7')

    mod43_med = ee.Image.cat([b1, b2, b3, b4, b6, b7]).clip(aoi)

    return mod43_med

def executeSMA(coords,start_date,end_date):
    geometry = ee.Geometry.Polygon(coords)

    # geometry = ee.Geometry.Polygon(
    #         [[[20.63232421875, -19.890723023996898],
    #           [21.07177734375, -19.76670355171696],
    #           [21.02783203125, -19.43551433909781],
    #           [20.45654296875, -19.559790136497398]]])
    mcd43_sma = ee.ImageCollection('projects/servir-wa/compil_imagery/optical/modis_sma/africa/afr_mcd43a4_sma_2000_2018')

    start_date = ee.Date(start_date)
    end_date = ee.Date(end_date)
    start_2018 = ee.Date('2018-01-01')
    today = time.strftime("%Y-%m-%d")
    endTime = ee.Date(today)

    mcd43_sma_ = mcd43_sma.filterDate(start_date, end_date).filterBounds(geometry)

    mod43_2018 = modis_comp(geometry, start_2018, endTime)

    visParams = {'min':0,'max':5000, 'bands':'b6,b4,b3'}

    mcd43_sma_mapid = mod43_2018.getMapId(visParams)

    bsf_ts_values = makeTimeSeries(mcd43_sma_.select('band_0'),geometry,key='band_0')

    pvf_ts_values = makeTimeSeries(mcd43_sma_.select('band_1'),geometry,key='band_1')

    npvf_ts_values = makeTimeSeries(mcd43_sma_.select('band_2'),geometry,key='band_2')

    mapid = mcd43_sma_mapid['mapid']
    maptoken = mcd43_sma_mapid['token']

    json_obj = {}

    json_obj["mapid"] = mapid
    json_obj["maptoken"] = maptoken
    json_obj["bsf_ts_values"] = bsf_ts_values
    json_obj["bsf_ts_values"] = bsf_ts_values
    json_obj["pvf_ts_values"] = pvf_ts_values
    json_obj["npvf_ts_values"] = npvf_ts_values

    print mapid, maptoken
    print bsf_ts_values
    print pvf_ts_values
    print npvf_ts_values

    return json_obj
