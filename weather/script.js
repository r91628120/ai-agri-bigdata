let townshipData = {};

// 讀取全台縣市鄉鎮 JSON
window.addEventListener("DOMContentLoaded", async () => {
  const countySelect = document.getElementById("countySelect");

  try {
    const response = await fetch("./townships.json");
    townshipData = await response.json();

    Object.keys(townshipData).forEach(county => {
      const option = document.createElement("option");
      option.value = county;
      option.textContent = county;
      countySelect.appendChild(option);
    });

  } catch (error) {
    console.error(error);
    countySelect.innerHTML = `<option value="">縣市資料讀取失敗</option>`;
  }

  document
    .getElementById("countySelect")
    .addEventListener("change", updateTownships);

  document
    .getElementById("analyzeBtn")
    .addEventListener("click", analyzeWeatherRisk);
});

// 依縣市更新鄉鎮
function updateTownships() {
  const county = document.getElementById("countySelect").value;
  const townshipSelect = document.getElementById("townshipSelect");

  townshipSelect.innerHTML = "";

  if (!county) {
    townshipSelect.innerHTML = `<option value="">請先選擇縣市</option>`;
    return;
  }

  townshipSelect.innerHTML = `<option value="">請選擇鄉鎮</option>`;

  townshipData[county].forEach(town => {
    const option = document.createElement("option");
    option.value = town;
    option.textContent = town;
    townshipSelect.appendChild(option);
  });
}

// 主要分析功能
function analyzeWeatherRisk() {
  const crop = document.getElementById("cropInput").value.trim();
  const county = document.getElementById("countySelect").value;
  const township = document.getElementById("townshipSelect").value;

  const weatherRisk = document.getElementById("weatherRisk");
  const climateAlert = document.getElementById("climateAlert");

  if (!crop) {
    weatherRisk.innerHTML = `
      <p>⚠️ 請先輸入作物名稱。</p>
    `;
    climateAlert.innerHTML = `尚未分析`;
    return;
  }

  if (!county || !township) {
    weatherRisk.innerHTML = `
      <p>⚠️ 請選擇產地縣市與鄉鎮。</p>
    `;
    climateAlert.innerHTML = `尚未分析`;
    return;
  }

  const locationText = `${county}${township}`;

  const risk = buildAgricultureWeatherRisk(crop, county, township);

  weatherRisk.innerHTML = `
    <p><strong>作物：</strong>${crop}</p>
    <p><strong>產地：</strong>${locationText}</p>

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
      <strong>AI農業氣象建議：</strong><br>
      ${risk.advice}
    </p>
  `;

  climateAlert.innerHTML = `
    <div class="alert-box">
      <h4>🚨 AI重大氣候警示</h4>

      <p>
        若近期有颱風、豪雨、高溫或寒流警報，
        可能影響採收、運輸、品質保存與市場價格波動。
      </p>

      <p>
        建議農民在出貨前，先確認中央氣象署最新預報與颱風消息。
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

// 農業氣象風險判讀邏輯 v1.0
function buildAgricultureWeatherRisk(crop, county, township) {
  let heatRisk = "中";
  let rainRisk = "中";
  let transportRisk = "中";
  let qualityRisk = "中";

  let advice = "請搭配中央氣象署1週預報與颱風消息，判斷採收、運輸與保存時機。";

  const southAreas = ["屏東縣", "高雄市", "臺南市", "嘉義縣"];
  const eastAreas = ["臺東縣", "花蓮縣", "宜蘭縣"];

  const fruitCrops = ["芒果", "蓮霧", "香蕉", "鳳梨", "木瓜", "番石榴", "荔枝", "龍眼"];
  const leafyCrops = ["甘藍", "小白菜", "青江菜", "萵苣", "菠菜", "空心菜"];
  const rootCrops = ["洋蔥", "胡蘿蔔", "馬鈴薯", "地瓜", "芋頭"];

  const isSouth = southAreas.includes(county);
  const isEast = eastAreas.includes(county);

  const isFruit = fruitCrops.some(item => crop.includes(item));
  const isLeafy = leafyCrops.some(item => crop.includes(item));
  const isRoot = rootCrops.some(item => crop.includes(item));

  if (isSouth && isFruit) {
    heatRisk = "高";
    rainRisk = "中";
    transportRisk = "中";
    qualityRisk = "高";

    advice = `
      南部果樹產區在高溫季節需特別注意果實日燒、
      採後失水與運輸保鮮。建議避開中午高溫時段採收，
      採後儘速遮陰、降溫與出貨。
    `;
  }

  if (isEast && isFruit) {
    heatRisk = "中";
    rainRisk = "高";
    transportRisk = "高";
    qualityRisk = "中";

    advice = `
      東部果樹產區需特別注意豪雨、強風與颱風影響。
      若中央氣象署發布颱風或豪雨資訊，建議提前檢查支架、
      排水與採收時程。
    `;
  }

  if (isLeafy) {
    heatRisk = "高";
    rainRisk = "中";
    transportRisk = "中";
    qualityRisk = "高";

    advice = `
      葉菜類對高溫與降雨變化敏感，
      高溫容易造成萎凋、品質下降，
      連續降雨則可能增加病害與採收困難。
    `;
  }

  if (isRoot) {
    heatRisk = "中";
    rainRisk = "中";
    transportRisk = "低";
    qualityRisk = "中";

    advice = `
      根莖類作物相對穩定，但仍需注意連續降雨造成田間積水、
      採收困難與儲藏品質下降。
    `;
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
    advice
  };
}

// 將風險文字轉成 CSS class
function getRiskClass(level) {
  if (level === "高") return "risk-high";
  if (level === "中") return "risk-mid";
  return "risk-low";
}