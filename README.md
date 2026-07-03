# Change-Detection-Deforestation-SukabumiCity-GEE-NDVI-NDBI-LULC-2015-2025

# Deteksi Perubahan Tutupan Lahan dan Klasifikasi Penggunaan Lahan Kota Sukabumi (2015–2025)

Repository ini berisi skrip Google Earth Engine (GEE) untuk mendeteksi perubahan tutupan lahan (*land cover change detection*) dan mengklasifikasikan penggunaan lahan di Kota Sukabumi, Jawa Barat, dengan membandingkan kondisi tahun 2015 dan 2025 menggunakan citra satelit Landsat 8.

## 📌 Latar Belakang

Kota Sukabumi mengalami dinamika pertumbuhan wilayah yang cukup signifikan dalam satu dekade terakhir, ditandai dengan meningkatnya luas area terbangun (permukiman, infrastruktur) yang berpotensi mengurangi luas tutupan vegetasi dan lahan terbuka hijau. Perubahan ini penting untuk dipantau karena berkaitan erat dengan perencanaan tata ruang wilayah, mitigasi bencana, serta pengelolaan lingkungan berkelanjutan.

Penginderaan jauh (*remote sensing*) berbasis citra satelit multi-temporal menjadi salah satu metode yang efektif dan efisien untuk memantau perubahan tutupan lahan pada cakupan wilayah yang luas dengan interval waktu tertentu, tanpa memerlukan survei lapangan yang intensif. Melalui platform Google Earth Engine, pengolahan citra dalam skala besar dapat dilakukan secara *cloud-based* sehingga mempercepat proses analisis.

Proyek ini bertujuan untuk:
1. Mengidentifikasi area yang mengalami peningkatan (*gain*) dan penurunan (*loss*) tutupan vegetasi antara tahun 2015 dan 2025 menggunakan metode *delta Normalized Burn Ratio* (dNBR).
2. Mengklasifikasikan penggunaan lahan pada masing-masing tahun menggunakan algoritma *machine learning* Random Forest dan CART (*Classification and Regression Tree*).
3. Menghitung estimasi luas area yang mengalami perubahan tutupan lahan dalam satuan hektar.

## 🛰️ Data yang Digunakan

| Data | Sumber | Keterangan |
|---|---|---|
| Citra Satelit | Landsat 8 Collection 2, Level 2 (`LANDSAT/LC08/C02/T1_L2`) | Surface Reflectance, tahun 2015 dan 2025 |
| Batas Administrasi | Shapefile/Asset GEE Kota Sukabumi | Digunakan sebagai area kajian (AOI) |
| Sampel Training | Digitasi manual (vegetation, bareland, residential area) | Digunakan untuk klasifikasi terbimbing (*supervised classification*) |

## ⚙️ Alur Pengolahan Data (Workflow)

```
1. Input Data & Area Kajian
   └── Load boundary Kota Sukabumi

2. Pra-pemrosesan Citra Landsat 8
   ├── Cloud & shadow masking (QA_PIXEL bitwise)
   ├── Koreksi skala reflektansi (scale factor 0.0000275, offset -0.2)
   └── Filter temporal (2015 & 2025) + median composite

3. Visualisasi Citra
   ├── Komposit False Color (SWIR2-Red-NIR)
   └── Komposit True Color/RGB

4. Deteksi Perubahan (Change Detection)
   ├── Hitung NBR 2015 dan NBR 2025
   ├── Hitung dNBR = NBR2025 − NBR2015
   ├── Klasifikasi ambang batas (threshold): Gain / Loss / No Change
   └── Hitung luas area Gain dan Loss (hektar)

5. Analisis Indeks Spektral Tambahan
   ├── NDVI 2015 & 2025 (indikasi vegetasi)
   └── NDBI 2015 & 2025 (indikasi lahan terbangun)

6. Klasifikasi Penggunaan Lahan (Supervised Classification)
   ├── Training sample: vegetation, bareland, residential area
   ├── Random Forest (50 trees)
   └── CART (Classification and Regression Tree)

7. Output
   ├── Peta perubahan tutupan lahan
   ├── Peta klasifikasi lahan 2015 & 2025 (RF dan CART)
   └── Estimasi luas perubahan (hektar)
```

## 🧮 Metodologi

### 1. Pra-pemrosesan Citra
Citra Landsat 8 Collection 2 Level 2 dikoreksi menggunakan *scale factor* resmi USGS untuk mengonversi nilai digital number menjadi nilai reflektansi permukaan. Piksel yang terkontaminasi awan, bayangan awan, dan *dilated cloud* dimasking menggunakan band `QA_PIXEL` dengan pendekatan *bitwise masking*.

### 2. Delta Normalized Burn Ratio (dNBR)
NBR dihitung dari kombinasi band NIR dan SWIR2:

```
NBR = (NIR − SWIR2) / (NIR + SWIR2)
dNBR = NBR(2025) − NBR(2015)
```

Nilai dNBR kemudian diklasifikasikan menggunakan ambang batas (*threshold*) ±0.10 untuk membedakan area yang mengalami peningkatan vegetasi (*gain*), penurunan vegetasi (*loss*), dan area yang relatif tidak berubah.

### 3. Indeks Spektral Pendukung
- **NDVI** (*Normalized Difference Vegetation Index*): mengindikasikan kerapatan vegetasi.
- **NDBI** (*Normalized Difference Built-up Index*): mengindikasikan tingkat lahan terbangun.

### 4. Klasifikasi Terbimbing
Klasifikasi penggunaan lahan dilakukan dengan pendekatan *supervised classification* menggunakan tiga kelas: vegetasi, lahan terbuka (*bareland*), dan area permukiman (*residential area*). Dua algoritma digunakan untuk perbandingan performa:
- **Random Forest** (`smileRandomForest`, 50 pohon keputusan)
- **CART** (`smileCart`)

## 📁 Struktur Repository

```
├── change_detection_klasifikasi_sukabumi.js   # Skrip utama GEE
├── README.md                                   # Dokumentasi proyek
```

## 🚀 Cara Menjalankan

1. Buka [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Buat *script* baru, lalu salin isi file `change_detection_klasifikasi_sukabumi.js`.
3. Tambahkan aset berikut pada bagian *Imports* sebelum menjalankan skrip:
   - `sukabumi` — geometri/*feature collection* batas administrasi Kota Sukabumi.
   - `vegetation`, `bareland`, `residentialarea` — *feature collection* titik/poligon sampel training untuk masing-masing kelas tutupan lahan.
4. Jalankan skrip (*Run*), lalu periksa hasil pada panel **Console** dan **Map**.

## 📊 Hasil yang Diharapkan

- Peta *Raw dNBR* yang menunjukkan sebaran nilai perubahan NBR.
- Peta klasifikasi perubahan tutupan lahan (Gain/Loss/No Change).
- Estimasi luas area *gain* dan *loss* dalam hektar.
- Peta klasifikasi penggunaan lahan tahun 2015 dan 2025 hasil algoritma Random Forest dan CART.

## Hasil visualisasi 
### NDVI 2015
<img width="389" height="343" alt="image" src="https://github.com/user-attachments/assets/781fd647-a98a-4874-9227-8be7db8de3ab" />

### NDVI 2025
<img width="401" height="349" alt="image" src="https://github.com/user-attachments/assets/d270d547-19e5-4924-a27c-16d79a08d6e8" />

### NDBI 2015
<img width="396" height="349" alt="image" src="https://github.com/user-attachments/assets/763cbcaa-6bfe-42b1-bb20-9bda4e39fafa" />

### NDBI 2025
<img width="377" height="353" alt="image" src="https://github.com/user-attachments/assets/31035d4c-24f4-43fb-843a-2105cf8e9e88" />

### Klasifikasi Metode Random Forest 2015
<img width="424" height="346" alt="image" src="https://github.com/user-attachments/assets/133051e6-7e8d-4826-a467-836d2a6cd777" />

### Klasifikasi Metode Random Forest 2025
<img width="392" height="353" alt="image" src="https://github.com/user-attachments/assets/d109556a-07f5-46de-a047-a79d2add5f65" />

### Klasifikasi Netode CART 2015
<img width="380" height="346" alt="image" src="https://github.com/user-attachments/assets/d67cc4a0-52ba-4c56-aae1-2e92cb8bf97c" />

### Klasifikasi Metode CART 2025
<img width="410" height="347" alt="image" src="https://github.com/user-attachments/assets/f051e7a8-b78e-455a-97c8-b309e922dcf4" />


## ⚠️ Catatan & Keterbatasan

- Klasifikasi tahun 2025 pada skrip ini masih menggunakan sampel training (`classifiertraining`) yang diambil dari citra tahun 2015; disarankan menggunakan sampel training terpisah yang representatif terhadap kondisi 2025 untuk akurasi klasifikasi yang lebih baik.
- Ambang batas (*threshold*) dNBR sebesar ±0.10 bersifat empiris dan dapat disesuaikan tergantung karakteristik area kajian.
- Akurasi klasifikasi belum divalidasi dengan data lapangan (*ground truth*) atau *confusion matrix*; disarankan menambahkan tahap validasi akurasi (*accuracy assessment*) pada pengembangan selanjutnya.

## 📚 Referensi

- Key, C. H., & Benson, N. C. (2006). *Landscape assessment: Ground measure of severity, the composite burn index; and remote sensing of severity, the normalized burn ratio*. USDA Forest Service General Technical Report.
- United States Geological Survey. (2022). *Landsat Collection 2 Level-2 Science Products*. U.S. Geological Survey.
- Cardille, J. A., Crowley, M. A., Saah, D., & Clinton, N. E. (Eds.). (2024). Cloud-Based Remote Sensing with Google Earth Engine: Fundamentals and Applications. Springer Nature Switzerland. https://doi.org/10.1007/978-3-031-26588-4
- 

## 👤 Penulis

Disusun sebagai bagian dari eksplorasi mandiri di bidang penginderaan jauh dan Sistem Informasi Geografis (SIG), Program Studi Teknik Geodesi, Universitas Diponegoro.

## 📄 Lisensi

Proyek ini dapat digunakan secara bebas untuk keperluan edukasi dan non-komersial. Mohon cantumkan atribusi apabila digunakan kembali.
