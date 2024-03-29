<script setup>
import { onMounted, ref, watchEffect, computed } from 'vue'
const getImageUrl=(file)=>{
  return new URL(`./assets/${file}`, import.meta.url).href
}
import axios from 'axios';
// *import leaflet
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// *Cluster套件的css
import "leaflet.markercluster/dist/leaflet.markercluster";
import "leaflet.markercluster/dist/markercluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import d3 from './components/d3.vue'
const mapDom = ref(null) // 地圖的DOM
const updateTime = ref(null) 
const apiUrl = ref('https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json')
const bycicle_all = ref([])
const bycicle_full = ref([])
const bycicle_empty = ref([])
const bycicle_available = ref([])
const total_sbi = ref()
const total_bemp = ref()
// const total_per = computed(()=>(total_sbi.value/(total_sbi.value+total_bemp.value)*100).toFixed(1)+'%')
const d3show = ref(false)
// ********leaflet********
function makeMap(){
  // *L.map(<String> id | <HTMLElement> el , options) 初始化地圖設定，第1個參數能接收ID選取器或DOM，第2個參數options設定地圖經緯度和縮放層級
    const initPosition = [25.06275694939137, 121.51744527606215]
  const zoomLevel = 19
  const map = L.map(mapDom.value).setView(initPosition, zoomLevel);
  // *L.tilelayer(<String> urlTemplate, <TileLayer options> options) 建立圖資：urlTemplate 圖資請求設定，attribution 圖資版權設定
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map); // 加入map物件
  // *製作icon
  // 共同設定
  const icon = L.Icon.extend({
    options: {
      iconSize: [40, 40], // icon大小
      iconAnchor: [20, 30], // icon偏移
      popupAnchor: [0, -20], // popup偏移
    }
  })
  const bycicle_available_icon = new icon({iconUrl: getImageUrl('bycicle-available.png')});
  const bycicle_full_icon = new icon({iconUrl: getImageUrl('bycicle-full.png')});
  const bycicle_empty_icon = new icon({iconUrl: getImageUrl('bycicle-empty.png')});
  const initPosition_icon = new icon({iconUrl: getImageUrl('initPosition.png')});
  // 引用markerClusterGroup()叢集方法
  var markers = L.markerClusterGroup();
  // *L.marker(latlng, options) 製作標記: latlng 設定圖標經緯度，options 設定圖標狀態：draggable: true可拖曳
  bycicle_available.value.map(bycicle=>L.marker(new L.LatLng(bycicle.lat, bycicle.lng),{icon: bycicle_available_icon})
  .bindPopup(`${bycicle.sna}<br>可租借車輛：${bycicle.sbi}<br>總停車格：${bycicle.tot}<br>空位數：${bycicle.bemp}`))
  .forEach(marker => markers.addLayer(marker)) //繪製標記至叢集中
  bycicle_full.value.map(bycicle=>L.marker(new L.LatLng(bycicle.lat, bycicle.lng),{icon: bycicle_full_icon})
  .bindPopup(`${bycicle.sna}<br>可租借車輛：${bycicle.sbi}<br>總停車格：${bycicle.tot}<br>空位數：${bycicle.bemp}`))
  .forEach(marker => markers.addLayer(marker))
  bycicle_empty.value.map(bycicle=>L.marker(new L.LatLng(bycicle.lat, bycicle.lng),{icon: bycicle_empty_icon})
  .bindPopup(`${bycicle.sna}<br>可租借車輛：${bycicle.sbi}<br>總停車格：${bycicle.tot}<br>空位數：${bycicle.bemp}`))
  .forEach(marker => markers.addLayer(marker))
  // 繪製叢集至地圖上
  map.addLayer(markers)
  const marker = L.marker(initPosition,{icon: initPosition_icon}).addTo(map) //加一個目前位置
  // 獲取使用者地理位置
  map.locate({
    setView: false, // 是否讓地圖跟著移動中心點
    watch: true, // 是否要一直監測使用者位置
    maxZoom: 18, // 最大的縮放值
    enableHighAccuracy: true, // 是否要高精準度的抓位置
    timeout: 10000 // 觸發locationerror事件之前等待的毫秒數
  });
  function foundHandler(e) {
    map.panTo(e.latlng) // 移動地圖中心點
    marker.setLatLng(e.latlng) // 移動 marker
  }
  map.on('locationfound', foundHandler) // 使用者點擊允許觸發locationfound
}
// function mathTotal(){
//   total_sbi.value = bycicle_all.value.reduce((total,item)=>total+item.sbi,0)
//   total_bemp.value = bycicle_all.value.reduce((total,item)=>total+item.bemp,0)
// }
onMounted(()=>{
  // 打API 並分類資料
  watchEffect(async()=>{
    const { data } = await axios.get(apiUrl.value)
    bycicle_all.value.push(...data) // api打回總數
    bycicle_available.value.push(...bycicle_all.value.filter(i=>i.bemp!==0 && i.sbi!==0)) // 皆不等於0(可租可還)
    bycicle_full.value.push(...bycicle_all.value.filter(i=>i.bemp===0)) // 場站空位數量為0 (可租不可還)
    bycicle_empty.value.push(...bycicle_all.value.filter(i=>i.sbi===0)) // 場站車輛數量為0 (不可租可還)
    updateTime.value.textContent = `最後更新：${bycicle_all.value[0].updateTime}`
    makeMap()
    // mathTotal()
  })
})

</script>
<template>  
  <main id="map" ref="mapDom"></main>
  <Transition name="slide">
  <d3 v-if="d3show" :bycicle_all="bycicle_all"/>
  </Transition>

  <div class="icons" @click="d3show=!d3show">
    <div class="icon">
      <div><img src="./assets/bycicle-available.png" alt=""></div>
      <div>正常租借</div>
    </div>
    <div class="icon">
      <div><img src="./assets/bycicle-full.png" alt=""></div>
      <div>車位滿載</div>
    </div>
    <div class="icon">
      <div><img src="./assets/bycicle-empty.png" alt=""></div>
      <div>無車可租</div>
    </div>
  </div>

  <div id="message" ref="updateTime"></div>
</template>
<style lang="scss" scoped>
#map{
  width: 100%;
  height: 100%;
  background: darkcyan;
}
#message{
  position: absolute;
  padding: 0 5px;
  right: 0;
  top: 0;
  color: rgb(98, 98, 98);
  font-size: 20px;
  z-index: 800;
  background: rgb(255, 255, 255, 0.7);
  border-radius: 30px;
  
}
.icons{
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  width: 60%;
  height: 100px;
  background: rgb(255, 255, 255, 0.7);
  border-radius: 30px 30px 0 0;
  z-index: 1000;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  cursor: pointer;
  // &::after{
  //   content: '';
  //   width: v-bind(total_per);
  //   height: 100%;
  //   position: absolute;
  //   border-radius: 30px 0 0 0;
  //   top: 0;
  //   left: 0;
  //   background: #fda42785;
  // }
  .icon{
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    z-index: 1;
  }
}


.slide-enter-active, .slide-leave-active {
  transition: all .2s linear;
}
.slide-enter-from {
  opacity: 0;
}
.slide-leave-to {
  opacity: 0;
}
</style>