/* AI農業氣象整合中心 script.js v2.0 */

const WEATHER_API_URL = "https://script.google.com/macros/s/AKfycbyegFC6V-J02oRtnSHHqUcu98AtDSr-62m69FrT3vqzHYgNW2-T5UxQvoylbf3YUo8m/exec";

let townshipData = {};

let latestWeatherData = null;

/* 農業氣象站資料，可未來再擴充 */
const AGRI_STATIONS = [
  { id: "C2C410", name: "中央大學", lat: 24.9680, lng: 121.1950 },
  { id: "72C440", name: "桃園農改", lat: 24.9500, lng: 121.0300 },
  { id: "82A750", name: "茶改北部分場", lat: 24.9100, lng: 121.7000 },
  { id: "72D680", name: "桃改新埔分場", lat: 24.8300, lng: 121.0700 },
  { id: "K2E360", name: "苗栗農改", lat: 24.5600, lng: 120.8200 },
  { id: "G2F820", name: "農業試驗所", lat: 24.0300, lng: 120.6900 },
  { id: "72G600", name: "臺中農改", lat: 24.0000, lng: 120.5300 },
  { id: "72HA00", name: "中改埔里分場", lat: 23.9700, lng: 120.9700 },
  { id: "U2H480", name: "臺大溪頭", lat: 23.6740, lng: 120.7950 },
  { id: "A2K630", name: "臺大雲林校區", lat: 23.7000, lng: 120.5300 },
  { id: "C2M910", name: "嘉義大學", lat: 23.4630, lng: 120.4840 },
  { id: "72N100", name: "臺南農改", lat: 23.0500, lng: 120.3300 },
  { id: "72Q010", name: "高雄農改", lat: 22.9000, lng: 120.5300 },
  { id: "G2P820", name: "農試鳳山分所", lat: 22.6300, lng: 120.3500 },
  { id: "C2R970", name: "屏科大", lat: 22.6408, lng: 120.5960 },
  { id: "B2Q810", name: "畜試南區分所", lat: 22.5400, lng: 120.5300 },
  { id: "72S590", name: "東改賓朗果園", lat: 22.7900, lng: 121.0900 },
  { id: "72T250", name: "花蓮農改", lat: 23.9700, lng: 121.5900 },
  { id: "72U480", name: "花改蘭陽分場", lat: 24.7500, lng: 121.7500 }
];

/* 沒接 Google Geocoding 前，先用縣市代表座標 */
const COUNTY_COORDS = {
  "臺北市": { lat: 25.0330, lng: 121.5654 },
  "新北市": { lat: 25.0169, lng: 121.4628 },
  "基隆市": { lat: 25.1276, lng: 121.7392 },
  "桃園市": { lat: 24.9936, lng: 121.3010 },
  "新竹市": { lat: 24.8138, lng: 120.9675 },
  "新竹縣": { lat: 24.8387, lng: 121.0177 },
  "苗栗縣": { lat: 24.5602, lng: 120.8214 },
  "臺中市": { lat: 24.1477, lng: 120.6736 },
  "彰化縣": { lat: 24.0518, lng: 120.5161 },
  "南投縣": { lat: 23.9609, lng: 120.9719 },
  "雲林縣": { lat: 23.7092, lng: 120.4313 },
  "嘉義市": { lat: 23.4801, lng: 120.4491 },
  "嘉義縣": { lat: 23.4518, lng: 120.2555 },
  "臺南市": { lat: 22.9999, lng: 120.2270 },
  "高雄市": { lat: 22.6273, lng: 120.3014 },
  "屏東縣": { lat: 22.5519, lng: 120.5488 },
  "宜蘭縣": { lat: 24.7021, lng: 121.7378 },
  "花蓮縣": { lat: 23.9872, lng: 121.6015 },
  "臺東縣": { lat: 22.7972, lng: 121.0714 },
  "澎湖縣": { lat: 23.5711, lng: 119.5793 },
  "金門縣": { lat: 24.4321, lng: 118.3171 },
  "連江縣": { lat: 26.1602, lng: 119.9517 }
};

window.addEventListener("DOMContentLoaded", async () => {
  await loadTownships();

  document
    .getElementById("countySelect")
    .addEventListener("change", updateTownships);

  document
    .getElementById("analyzeBtn")
    .addEventListener("click", analyzeWeatherRisk);
});

async function loadTownships() {
  const countySelect = document.getElementById("countySelect");

  try {
    const response = await fetch("./townships.json?v=20260623");
    townshipData = await response.json();

    countySelect.innerHTML = `<option value="">請選擇縣市</option>`;

    Object.keys(townshipData).forEach(county => {
      const option = document.createElement("option");
      option.value = county;
      option.textContent = county;
      countySelect.appendChild(option);
    });

  } catch (error) {
    console.error("townships.json 讀取失敗：", error);
    countySelect.innerHTML = `<option value="">縣市資料讀取失敗</option>`;
  }
}

function updateTownships() {
  const county = document.getElementById("countySelect").value;
  const townshipSelect = document.getElementById("townshipSelect");

  townshipSelect.innerHTML = `<option value="">請選擇鄉鎮</option>`;

  if (!county || !townshipData[county]) return;

  townshipData[county].forEach(town => {
    const townName = typeof town === "string"
      ? town
      : town.name || town.town || town.township || town.value;

    const option = document.createElement("option");
    option.value = townName;
    option.textContent = townName;
    townshipSelect.appendChild(option);
  });
}

async function analyzeWeatherRisk() {
  const crop = document.getElementById("cropInput").value.trim();
  const county = document.getElementById("countySelect").value;
  const township = document.getElementById("townshipSelect").value;

  const weatherRisk = document.getElementById("weatherRisk");
  const climateAlert = document.getElementById("climateAlert");

  if (!crop) {
    weatherRisk.innerHTML = `<p>⚠️ 請先輸入作物名稱。</p>`;
    climateAlert.innerHTML = `尚未分析`;
    return;
  }

  if (!county || !township) {
    weatherRisk.innerHTML = `<p>⚠️ 請選擇產地縣市與鄉鎮。</p>`;
    climateAlert.innerHTML = `尚未分析`;
    return;
  }

  weatherRisk.innerHTML = `<p>⏳ 正在尋找最近農業氣象站並讀取真實氣象資料...</p>`;
  climateAlert.innerHTML = `資料讀取中...`;

  const position = getCountyPosition(county);
  const station = findNearestStation(position.lat, position.lng);

  const weather = await fetchWeatherData(station.id);

  if (!weather || weather.success !== true) {
    weatherRisk.innerHTML = `
      <p>⚠️ 無法取得此測站即時資料。</p>
      <p><strong>系統嘗試測站：</strong>${station.name}（${station.id}）</p>
      <p>請確認 GAS 已部署最新版，或此測站目前是否有即時資料。</p>
    `;

    climateAlert.innerHTML = `
      <div class="alert-box">
        <h4>資料讀取提醒</h4>
        <p>目前無法取得農業氣象站即時資料，請稍後再試，或改選其他產地。</p>
      </div>
    `;
    return;
  }

  latestWeatherData = weather;
  updateWeatherDashboard(weather);

  const risk = buildAgricultureWeatherRisk(crop, county, township, weather);

               renderDiseaseRisk(crop, weather);

               renderFarmAdvice(risk);

               renderSixHourWeatherHistory(weather.history || []);

               buildScenario(crop, risk);

  weatherRisk.innerHTML = `
    <p><strong>作物：</strong>${crop}</p>
    <p><strong>產地：</strong>${county}${township}</p>
    <p><strong>最近農業氣象站：</strong>${station.name}（${station.id}，約 ${station.distanceKm.toFixed(1)} 公里）</p>
    <p><strong>觀測時間：</strong>${weather.obsTime || "--"}</p>

    <div class="risk-list">
      <div class="risk-item">
        <strong>🌡 高溫風險：</strong>
        <span class="${risk.heatClass}">${risk.heatRisk}</span>
      </div>

      <div class="risk-item">
        <strong>🌧 降雨風險：</strong>
        <span class="${risk.rainClass}">${risk.rainRisk}</span>
      </div>

      <div class="risk-item">
        <strong>🚚 採收運輸風險：</strong>
        <span class="${risk.transportClass}">${risk.transportRisk}</span>
      </div>

      <div class="risk-item">
        <strong>🧺 品質保存風險：</strong>
        <span class="${risk.qualityClass}">${risk.qualityRisk}</span>
      </div>
    </div>

    <p style="margin-top:16px;">
      <strong>即時氣象資料：</strong><br>
      氣溫：${showValue(weather.temp)} ℃｜
      相對濕度：${showValue(weather.humidity)} %｜
      實測雨量：${showValue(weather.rainMm)} mm｜
      風速：${showValue(weather.windSpeed)} m/s｜
      日照：${showValue(weather.sunshine)} hr
    </p>

    <p style="margin-top:16px;">
      <strong>AI農業氣象建議：</strong><br>
      ${risk.advice}
    </p>
  `;

   climateAlert.innerHTML = buildClimateAlertHtml(risk, weather);
   updateAIPrompt(crop, county, township, station, weather, risk);

   // 啟動四大升級區
   updateSmartDecisionSections(crop, weather, risk);

  }

async function fetchWeatherData(stationId) {
  try {
    const url =
      WEATHER_API_URL +
      "?location=" + encodeURIComponent(stationId);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("GAS API 回應失敗");
    }

    return await response.json();

  } catch (error) {
    console.error("農業氣象資料讀取失敗：", error);
    return null;
  }
}

function getCountyPosition(county) {
  return COUNTY_COORDS[county] || { lat: 23.6978, lng: 120.9605 };
}

function findNearestStation(lat, lng) {
  let best = null;

  AGRI_STATIONS.forEach(station => {
    const distanceKm = getDistanceKm(lat, lng, station.lat, station.lng);

    if (!best || distanceKm < best.distanceKm) {
      best = {
        ...station,
        distanceKm
      };
    }
  });

  return best;
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value) {
  return value * Math.PI / 180;
}

function buildAgricultureWeatherRisk(crop, county, township, weather) {
  const temp = Number(weather.temp);
  const humidity = Number(weather.humidity);
  const rainMm = Number(weather.rainMm);
  const windSpeed = Number(weather.windSpeed);

  let heatRisk = "低";
  let rainRisk = "低";
  let transportRisk = "低";
  let qualityRisk = "低";

  const fruitCrops = ["芒果", "蓮霧", "香蕉", "鳳梨", "木瓜", "番石榴", "荔枝", "龍眼", "火龍果"];
  const leafyCrops = ["甘藍", "小白菜", "青江菜", "萵苣", "菠菜", "空心菜", "葉菜"];
  const rootCrops = ["洋蔥", "胡蘿蔔", "馬鈴薯", "地瓜", "芋頭"];

  const isFruit = fruitCrops.some(item => crop.includes(item));
  const isLeafy = leafyCrops.some(item => crop.includes(item));
  const isRoot = rootCrops.some(item => crop.includes(item));

  if (temp >= 34) heatRisk = "高";
  else if (temp >= 31) heatRisk = "中";

  if (rainMm >= 20) rainRisk = "高";
  else if (rainMm >= 5) rainRisk = "中";

  if (humidity >= 88 || rainMm >= 10) qualityRisk = "高";
  else if (humidity >= 78 || rainMm >= 3) qualityRisk = "中";

  if (windSpeed >= 8 || rainMm >= 20) transportRisk = "高";
  else if (windSpeed >= 4 || rainMm >= 5) transportRisk = "中";

  if (isFruit && temp >= 32) qualityRisk = upgradeRisk(qualityRisk);
  if (isFruit && humidity >= 80) rainRisk = upgradeRisk(rainRisk);
  if (isLeafy && temp >= 30) heatRisk = upgradeRisk(heatRisk);
  if (isLeafy && humidity >= 80) qualityRisk = upgradeRisk(qualityRisk);
  if (isRoot && rainMm >= 10) rainRisk = upgradeRisk(rainRisk);

  let advice = [];

  if (heatRisk === "高") {
    advice.push("目前高溫風險偏高，建議避開中午作業，採收後立即遮陰、降溫並縮短田間曝曬時間。");
  }

  if (rainRisk === "高") {
    advice.push("目前降雨風險偏高，請優先檢查排水、田區積水、果實裂果與病害擴散風險。");
  }

  if (humidity >= 80) {
    advice.push("相對濕度偏高，病害發生機率增加，建議加強通風、巡田與病斑觀察。");
  }

  if (windSpeed >= 4) {
    advice.push("風速偏高，請留意支架、網室、果樹枝條與運輸穩定性。");
  }

  if (advice.length === 0) {
    advice.push("目前氣象條件相對穩定，可依作物生育期安排採收、施肥、灌溉與出貨。");
  }

  return {
    heatRisk,
    rainRisk,
    transportRisk,
    qualityRisk,
    heatClass: getRiskClass(heatRisk),
    rainClass: getRiskClass(rainRisk),
    transportClass: getRiskClass(transportRisk),
    qualityClass: getRiskClass(qualityRisk),
    advice: advice.join("<br>")
  };
}

function upgradeRisk(level) {
  if (level === "低") return "中";
  if (level === "中") return "高";
  return "高";
}

function getRiskClass(level) {
  if (level === "高") return "risk-high";
  if (level === "中") return "risk-mid";
  return "risk-low";
}

function buildClimateAlertHtml(risk, weather) {
  const highCount = [
    risk.heatRisk,
    risk.rainRisk,
    risk.transportRisk,
    risk.qualityRisk
  ].filter(item => item === "高").length;

  const alertLevel = highCount >= 2 ? "高" : highCount === 1 ? "中" : "低";

  return `
    <div class="alert-box">
      <h4>🚨 AI重大氣候警示：${alertLevel}</h4>

      <p>
        目前氣象條件顯示：
        氣溫 ${showValue(weather.temp)} ℃、
        濕度 ${showValue(weather.humidity)} %、
        雨量 ${showValue(weather.rainMm)} mm、
        風速 ${showValue(weather.windSpeed)} m/s。
      </p>

      <p>
        若近期有颱風、豪雨、高溫或寒流警報，
        可能影響採收、運輸、品質保存與市場價格波動。
      </p>

      <p>
        建議在出貨前確認中央氣象署最新預報與颱風消息。
      </p>

      <div class="button-group" style="margin-top:14px;">
        <a
          class="link-btn"
          href="https://www.cwa.gov.tw/V8/C/W/week.html"
          target="_blank">
          🌦️ 查看中央氣象署1週預報
        </a>

        <a
          class="link-btn typhoon-link"
          href="https://www.cwa.gov.tw/V8/C/P/Typhoon/TY_NEWS.html"
          target="_blank">
          🌀 查看最新颱風資訊
        </a>
      </div>
    </div>
  `;
}

function showValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "--"
  ) {
    return "--";
  }

  return value;
}

function updateAIPrompt(crop, county, township, station, weather, risk) {
  const promptBox = document.getElementById("aiPromptOutput");
  if (!promptBox) return;

  promptBox.value = `你是「AI農業氣象教練、作物栽培顧問與智慧農業決策教練」。

請根據以下農業情境，協助學生進行氣象判讀與農事決策推演。

【作物】
${crop}

【產地】
${county}${township}

【最近農業氣象站】
${station.name}（${station.id}，距離約 ${station.distanceKm.toFixed(1)} 公里）

【目前農業氣象資料】
觀測時間：${weather.obsTime || "--"}
氣溫：${showValue(weather.temp)} ℃
相對濕度：${showValue(weather.humidity)} %
實測雨量：${showValue(weather.rainMm)} mm
風速：${showValue(weather.windSpeed)} m/s
日照時數：${showValue(weather.sunshine)} hr

【目前初步風險判斷】
高溫風險：${risk.heatRisk}
降雨風險：${risk.rainRisk}
採收運輸風險：${risk.transportRisk}
品質保存風險：${risk.qualityRisk}

請輸出：
1. 氣象資料判讀
2. 對作物可能造成的影響
3. 採收、運輸與品質保存風險
4. 病蟲害或災害風險
5. 今日農事建議
6. 未來三天注意事項
7. 適合高中職學生理解的教學說明

請用條列式、清楚、實用、適合農業教育平台呈現的方式回答。`;
}

function copyAIPrompt() {
  const promptBox = document.getElementById("aiPromptOutput");
  if (!promptBox) return;

  promptBox.select();
  document.execCommand("copy");

  alert("已複製 AI 氣象決策指令，可以貼到 AI農業氣象教練 GPT 進一步分析！");
}

function updateWeatherDashboard(weather) {
  document.getElementById("dashTemp").textContent =
    `${showValue(weather.temp)} ℃`;

  document.getElementById("dashHumidity").textContent =
    `${showValue(weather.humidity)} %`;

  document.getElementById("dashRain").textContent =
    `${showValue(weather.rainMm)} mm`;

  document.getElementById("dashWind").textContent =
    `${showValue(weather.windSpeed)} m/s`;

  document.getElementById("dashSunshine").textContent =
    `${showValue(weather.sunshine)} hr`;
}

function clearAIPrompt() {

  const promptBox =
    document.getElementById("aiPromptOutput");

  if (!promptBox) return;

  if(confirm("確定要清除目前 AI 指令嗎？")){

      promptBox.value = "";

  }
}

function renderDiseaseRisk(crop, weather){

  const container =
    document.getElementById("diseaseRiskLights");

  if(!container) return;

  const humidity = Number(weather.humidity || 0);
  const rain = Number(weather.rainMm || 0);

  let diseases = [];

  if(crop.includes("芒果")){
    diseases = [
      {
        name:"炭疽病",
        risk: humidity > 80 ? "高" : "中"
      },
      {
        name:"白粉病",
        risk: humidity > 70 ? "中" : "低"
      }
    ];
  }
  else if(crop.includes("香蕉")){
    diseases = [
      {
        name:"黃葉病",
        risk: humidity > 75 ? "中" : "低"
      },
      {
        name:"葉斑病",
        risk: rain > 5 ? "高" : "中"
      }
    ];
  }
  else{
    diseases = [
      {
        name:"葉部病害",
        risk: humidity > 80 ? "高" : "中"
      }
    ];
  }

  container.innerHTML = diseases.map(d=>{

    const cls =
      d.risk==="高"
      ? "risk-high-box"
      : d.risk==="中"
      ? "risk-mid-box"
      : "risk-low-box";

    const dot =
      d.risk==="高"
      ? "🔴"
      : d.risk==="中"
      ? "🟡"
      : "🟢";

    return `
      <div class="disease-light ${cls}">
        <div class="disease-head">
          <span class="risk-dot">${dot}</span>
          <strong>${d.name}</strong>
          <b>${d.risk}</b>
        </div>
      </div>
    `;
  }).join("");
}

function renderFarmAdvice(risk){

  const box =
    document.getElementById("farmAdviceCards");

  if(!box) return;

  const cards = [];

  cards.push({
    icon:"🌱",
    title:"巡田觀察",
    text:"每日檢查葉片與病斑狀況"
  });

  if(risk.rainRisk==="高"){
    cards.push({
      icon:"🌧️",
      title:"排水管理",
      text:"注意田區積水與根系缺氧"
    });
  }

  if(risk.heatRisk==="高"){
    cards.push({
      icon:"☀️",
      title:"高溫防護",
      text:"避開中午作業並加強灌溉"
    });
  }

  cards.push({
    icon:"🚚",
    title:"採收規劃",
    text:"依氣象條件調整出貨時機"
  });

  box.innerHTML =
    cards.map(card=>`
      <div class="farm-advice-card">
        <div class="advice-icon">${card.icon}</div>
        <h4>${card.title}</h4>
        <p>${card.text}</p>
      </div>
    `).join("");
}


function renderSixHourWeatherHistory(history){

  const area = document.getElementById("historyChartArea");
  if(!area) return;

  if(!Array.isArray(history) || history.length === 0){
    area.innerHTML = `
      <div class="empty-state">
        尚無最近6小時氣象資料。請先完成氣象分析。
      </div>
    `;
    return;
  }

  const cleanHistory = history
    .filter(h => h && h.obsTime)
    .slice(-6)
    .map(h => ({
      time: formatHistoryHour(h.obsTime),
      temp: Number(h.temp || 0),
      humidity: Number(h.humidity || 0),
      rain: Number(h.rainMm || 0),
      wind: Number(h.windSpeed || 0)
    }));

  area.innerHTML = `
    <div class="history-table-wrap">
      <table class="history-table">
        <thead>
          <tr>
            <th>時間</th>
            <th>氣溫 ℃</th>
            <th>濕度 %</th>
            <th>雨量 mm</th>
            <th>風速 m/s</th>
          </tr>
        </thead>
        <tbody>
          ${cleanHistory.map(h => `
            <tr>
              <td>${h.time}</td>
              <td>${h.temp}</td>
              <td>${h.humidity}</td>
              <td>${h.rain}</td>
              <td>${h.wind}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="chart-stack">
      ${buildSixHourAxisChart("氣溫變化", "℃", cleanHistory.map(h => h.temp), cleanHistory.map(h => h.time))}
      ${buildSixHourAxisChart("濕度變化", "%", cleanHistory.map(h => h.humidity), cleanHistory.map(h => h.time))}
      ${buildSixHourAxisChart("雨量變化", "mm", cleanHistory.map(h => h.rain), cleanHistory.map(h => h.time))}
      ${buildSixHourAxisChart("風速變化", "m/s", cleanHistory.map(h => h.wind), cleanHistory.map(h => h.time))}
    </div>
  `;
}

function buildSixHourAxisChart(title, unit, data, labels){

  const max = Math.max(...data, 1);
  const yMax = unit === "%" ? 100 : Math.ceil(max / 10) * 10 || 10;

  return `
    <div class="axis-chart">
      <h4>${title}</h4>

      <div class="axis-chart-body">
        <div class="y-axis">
          <span>${yMax}${unit}</span>
          <span>${Math.round(yMax / 2)}${unit}</span>
          <span>0${unit}</span>
        </div>

        <div class="plot-area">
          <div class="grid-line top"></div>
          <div class="grid-line mid"></div>
          <div class="grid-line bottom"></div>

          <div class="bar-area">
            ${data.map((v, i) => `
              <div class="axis-bar-wrap">
                <div class="axis-bar-value">${v}</div>
                <div 
                  class="axis-bar"
                  style="height:${Math.max((v / yMax) * 100, 3)}%">
                </div>
                <div class="x-label">${labels[i]}</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="x-axis-title">X軸：最近6小時｜Y軸：${title}（${unit}）</div>
    </div>
  `;
}

function formatHistoryHour(obsTime){
  if(!obsTime) return "--";

  const date = new Date(obsTime);
  if(isNaN(date.getTime())){
    return String(obsTime).substring(11,16);
  }

  return `${String(date.getHours()).padStart(2,"0")}:00`;
}



let currentScenario = null;

function buildScenario(crop,risk){

  const box =
    document.getElementById(
      "scenarioQuestion"
    );

  if(!box) return;

  currentScenario = risk;

  box.innerHTML = `
    目前作物：
    <strong>${crop}</strong>

    <br><br>

    若未來三天持續
    ${risk.rainRisk==="高"
      ?"豪雨"
      :"高溫"}

    ，您會如何決策？
  `;
}

function answerScenario(answer){

  const box =
    document.getElementById(
      "scenarioFeedback"
    );

  if(!box) return;

  const messages = {
    A:"✅ 積極預防，可降低損失。",
    B:"⚠️ 需持續觀察氣象變化。",
    C:"🟡 保守策略，但可能影響產量。"
  };

  box.innerHTML =
    messages[answer];
}

function updateSmartDecisionSections(crop, weather, risk) {
  renderDiseaseRisk(crop, weather);
  renderFarmAdvice(risk);
  renderSixHourWeatherHistory(weather.history || []);
  buildScenario(crop, risk);
}

function clearWeatherHistory() {
  if (!confirm("確定要清除歷史氣象紀錄嗎？")) return;

  localStorage.removeItem("weatherHistory");

  const area = document.getElementById("historyChartArea");
  if (area) {
    area.innerHTML = `
      <div class="empty-state">
        尚無歷史紀錄。完成幾次氣象分析後，這裡會出現趨勢圖。
      </div>
    `;
  }
}
