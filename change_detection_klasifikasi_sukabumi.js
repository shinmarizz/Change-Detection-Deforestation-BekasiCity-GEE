Map.addLayer(sukabumi, {}, 'Kota Sukabumi')
Map.centerObject(sukabumi, 10);

function prepLandsat(image) {
  var qa = image.select('QA_PIXEL');
  var cloudShadowBitMask = (1 << 4); 
  var cloudsBitMask = (1 << 3);      
  var dilatedCloudBitMask = (1 << 1);

  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
    .and(qa.bitwiseAnd(cloudsBitMask).eq(0))
    .and(qa.bitwiseAnd(dilatedCloudBitMask).eq(0));

  var opticalBands = image.select('SR_B.*').multiply(0.0000275).add(-0.2);

  return image.addBands(opticalBands, null, true).updateMask(mask);
}


var landsat8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
  .map(prepLandsat) 
  .select(
    ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'],
    ['blue', 'green', 'red', 'nir', 'swir1', 'swir2']
  );

var image = landsat8
  .filterBounds(sukabumi)
  .filterDate('2015-01-01', '2015-12-31')
  .median()
  .clip(sukabumi);

var image2 = landsat8
  .filterBounds(sukabumi)
  .filterDate('2025-01-01', '2025-12-31')
  .median()
  .clip(sukabumi);

var visual = {
  bands: ['swir2', 'red', 'nir'],
  min: 0.0, 
  max: 0.45 
};

var visualrgb = {
  bands: ['red', 'green', 'blue'],
  min: 0.0,
  max: 0.15 
};

Map.centerObject(sukabumi, 11); 
Map.addLayer(image, visual, 'Citra False Color 2015'); 
Map.addLayer(image2, visual, 'Citra False Color 2025');
Map.addLayer(image, visualrgb, 'Citra RGB 2015');
Map.addLayer(image2, visualrgb, 'Citra RGB 2025');

var nbr2015 = image.normalizedDifference(['nir', 'swir2']).rename('NBR_2015');
var nbr2025 = image2.normalizedDifference(['nir', 'swir2']).rename('NBR_2025');

var diff = nbr2025.subtract(nbr2015).rename('change_detection');

Map.addLayer(diff, {min: -0.5, max: 0.5, palette: ['red', 'white', 'blue']}, 'Raw dNBR');

var thresholdGain = 0.10;
var thresholdLoss = -0.10;

var diffClassified = ee.Image.constant(0).clip(sukabumi);

diffClassified = diffClassified.where(diff.lte(thresholdLoss), 2);

diffClassified = diffClassified.where(diff.gte(thresholdGain), 1);

var changeVis = {
  palette: ['fcffc8', '2659eb', 'fa1373'], 
  min: 0,
  max: 2
}; 

Map.addLayer(diffClassified.selfMask(), changeVis, 'Klasifikasi Perubahan Tutupan Lahan');

var areaGain = diffClassified.eq(1).multiply(ee.Image.pixelArea());
var statsGain = areaGain.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: sukabumi.geometry(),
  scale: 30, 
  maxPixels: 1e13
});
var luasGainHa = ee.Number(statsGain.get('constant')).divide(10000);

var areaLoss = diffClassified.eq(2).multiply(ee.Image.pixelArea());
var statsLoss = areaLoss.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: sukabumi.geometry(),
  scale: 30,
  maxPixels: 1e13
});
var luasLossHa = ee.Number(statsLoss.get('constant')).divide(10000);

print('--- HASIL PERHITUNGAN LUAS ---');
print('Luas Area GAIN (Hektar):', luasGainHa);
print('Luas Area LOSS (Hektar):', luasLossHa);

var ndvi2015 = image.normalizedDifference(['nir','red']).rename('NDVI 2015')
var ndvi2025 = image2.normalizedDifference(['nir','red']).rename('NDVI 2025')

var ndbi2015 = image.normalizedDifference(['swir1','nir']).rename('NDBI 2015')
var ndbi2025 = image2.normalizedDifference(['swir1','nir']).rename('NDBI 2025')


Map.addLayer(ndvi2015, {
  min:-1,
  max:1,
  palette:['brown', 'yellow', 'green']
  }, 'NDVI 2015')
  
Map.addLayer(ndvi2025, {
  min:-1,
  max:1,
  palette:['brown', 'yellow', 'green']
  }, 'NDVI 2025')
  
Map.addLayer(ndbi2015, {
  min:-1,
  max:1,
  palette:['green', 'white', 'red']
  }, 'NDBI 2015')
  
Map.addLayer(ndbi2025, {
  min:-1,
  max:1,
  palette:['green', 'white', 'red']
  }, 'NDBI 2025')
  

var trainingfeatures = ee.FeatureCollection([vegetation, bareland, residentialarea]).flatten()

var predictionbands = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2']
var classifiertraining = image.select(predictionbands).sampleRegions({
  collection:trainingfeatures,
  properties:['class'],
  scale:30
})

var classifiertraining2025 = image.select(predictionbands).sampleRegions({
  collection:trainingfeatures,
  properties:['Class'],
  scale:30
})

var klasifikasi = ee.Classifier.smileRandomForest(50).train({
  features:classifiertraining,
  classProperty:'class',
  inputProperties:predictionbands
})
var classificationVis = {
min: 0,
max: 3,
palette: ['228B22', 'D2B48C', 'FF0000']
}; 

var rf = image.select(predictionbands).classify(klasifikasi)
Map.addLayer(rf,classificationVis, 'Klasifikasi 2015 - RF' )

var klasifikasicart = ee.Classifier.smileCart().train({
  features:classifiertraining,
  classProperty:'class',
  inputProperties:predictionbands
})

var cart = image.select(predictionbands).classify(klasifikasicart)
Map.addLayer(cart,classificationVis, 'Klasifikasi 2015 - CART' )

var klasifikasi2025 = ee.Classifier.smileRandomForest(50).train({
  features:classifiertraining,
  classProperty:'class',
  inputProperties:predictionbands
})

var rf2025 = image2.select(predictionbands).classify(klasifikasi2025)
Map.addLayer(rf2025,classificationVis, 'Klasifikasi 2025 - RF' )

var klasifikasicart2025 = ee.Classifier.smileCart().train({
  features:classifiertraining,
  classProperty:'class',
  inputProperties:predictionbands
})

var cart2025 = image2.select(predictionbands).classify(klasifikasicart2025)
Map.addLayer(cart2025,classificationVis, 'Klasifikasi 2025 - CART' )
