<script setup>
import { ref, onMounted, computed, watchEffect } from 'vue'
// *import d3
import * as d3 from "d3";

const prop = defineProps({
  bycicle_all: Array,
})
const sareaRentData = []

function drawBarChart(){

  const stack = d3
    .stack()
    .keys(["sbi", "bemp"])
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

  const dataset = stack(sareaRentData);

  let dimensions = {
    // 圖表尺寸
    width: 800,
    height: 600,
    margin: {
      top: 30,
      right: 10,
      bottom: 50,
      left: 50
    }
  };
  if(window.innerWidth < 780){
    dimensions.width = 400
    dimensions.height = 300
  }
  dimensions.boundedWidth =
    dimensions.width - // 圖表寬度
    dimensions.margin.left -
    dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - // 圖表高度
    dimensions.margin.top -
    dimensions.margin.bottom;

    d3.select('.chart svg').remove();
  const svg = d3
    .select(".chart")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = svg
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    ); // 畫布邊界

  const xScale = d3
    .scaleBand()
    .domain(sareaRentData.map((d) => d.sarea))
    .range([0, dimensions.boundedWidth])
    .padding(0.1);

  const yScale = d3
    .scaleLinear()
    // .domain([0, 5000]) 
    .domain([0, d3.max(dataset, (d) => d3.max(d, (d) => d[1]))]) //最高的
    .range([dimensions.boundedHeight, 0]);

  const color = d3
    .scaleOrdinal()
    .domain(["sbi", "bemp"])
    .range(["#FDA327", "#8D8F9D"]);

  // 堆疊柱狀圖
  bounds
    .selectAll("g")
    .data(dataset)
    .join("g")
    .selectAll("rect")
    .data((d) => d)
    .join("rect")
    .attr("x", (d) => xScale(d.data.sarea))
    .attr("y", (d) => yScale(d[1]))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
    .attr("fill", (d, i, nodes) => {
      // console.log(nodes[i].parentNode.__data__);
      return color(nodes[i].parentNode.__data__.key);
    });

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);
  bounds
    .append("g")
    .attr("transform", `translate(0, ${dimensions.boundedHeight})`)
    .call(xAxis);
  bounds.append("g").call(yAxis);

  const dateString = new Date();
  const today = d3.timeFormat("%Y-%m-%d %H:%M:%S")(dateString);

  //////// mouse事件
  bounds.on("mouseover", handleMouseOver)
        .on("mouseleave", handleMouseLeave)
  // 設定文字標籤
  const textTag = svg.append('text')
                    .attr('class', 'infoText')
                    .style('fill', '#000')
                    .style('font-size', '18px')
                    .style('font-weight', 'bold')
                    .style("text-anchor", 'middle')
                    .style('opacity', '0')

  function handleMouseOver(d, i){
    const pt = d3.pointer(event, svg.node())

    d3.select(this)
      .style('opacity', '0.5')

    // 加上文字標籤
    textTag
      .style('opacity', '1')
      .attr("x", pt[0])
      .attr('y', pt[1]-20)
      .text((d.target.__data__[1] - d.target.__data__[0]) + '個')
  }

  function handleMouseLeave(){
    d3.select(this)
      .style('opacity', '1')
    
    textTag.style('opacity', '0')
  }
  //////////// 圖例
  const tagsWrap = svg.append('g')
    .selectAll('g')
    .attr('class', 'tags')
    .data(["可租數", "空位數"])
    .enter()
    .append('g')
    .attr('transform', 'translate(220,0)')
  if(window.innerWidth < 780){
    tagsWrap.attr('transform', 'translate(30,0)')
  }
      
  tagsWrap.append('rect')
        .attr('x', (d,i)=> (i+1)*dimensions.margin.bottom*2)
        .attr('y', dimensions.height-dimensions.margin.bottom/3)
        .attr('width', 50)
        .attr('height', 20)
        .attr('fill', d => color(d))

  tagsWrap.append('text')
          .attr('x', (d,i)=> (i+1)*dimensions.margin.bottom*2+25)
          .attr('y', dimensions.height-4)
          .style('fill', '#000')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('text-anchor', 'middle')
          .text(d=>d)
}
d3.select(window).on('resize', drawBarChart);

onMounted(()=>{
  watchEffect(()=>{
    //計算有幾個區
    const sarea_all = computed(()=>{
      let arr=[]
      prop.bycicle_all.forEach(i=>arr.push(i.sarea))
      arr = arr.filter((item,index)=>arr.indexOf(item)===index)
      return arr
    })
    // 統計每個區的租借狀況
    for(let i=0; i<sarea_all.value.length; i++){
      const obj = {
        sarea: sarea_all.value[i],
        sbi: 0,
        bemp: 0,
      }
      prop.bycicle_all.forEach(item=>{
        if(sarea_all.value[i]==item.sarea){
          obj.sbi += item.sbi
          obj.bemp += item.bemp
        }
      })
      sareaRentData.push(obj)
    }
    drawBarChart()
    // console.log(sareaRentData)
  })
})
</script>

<template>
  <main class="warp">
    <h2>臺北市各區YouBike2.0租用狀況統計</h2>
    <div class="chart"></div>
  </main>
</template>

<style scoped>
.warp{
  width: 100%;
  height: 100%;
  margin: auto;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgb(183, 220, 222);
}
h2{
  font-size: 26px;
  color: #e19020;
}
</style>