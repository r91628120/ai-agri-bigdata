let townshipData = {};
let selectedPeriod = 7;

window.addEventListener("DOMContentLoaded", async () => {
  await loadTownships();

  document.querySelectorAll(".period-btn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".period-btn").forEach(btn => {
        btn.classList.remove("active");
      });

      button.classList.add("active");
      selectedPeriod = Number(button.dataset.period);
    });
  });

  document
    .getElementById("countySelect")
    .addEventListener("change", updateTownships);

  document
    .getElementById("predictBtn")
    .addEventListener("click", predictTrend);
});

async function loadTownships() {
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
}

function updateTownships() {
  const county = document.getElementById("countySelect").value;
  const townshipSelect = document.getElementById("townshipSelect");

  townshipSelect.innerHTML = "";

  if (!county) {
    townshipSelect.innerHTML = `<option value="">請先選擇縣市</option>`;
    return;
  }

  townshipSelect.innerHTML = `<option value="">請選擇鄉鎮</option>`;

  townshipData[county].forEach(township => {
    const option = document.createElement("option");
    option.value = township;
    option.textContent = township;
    townshipSelect.appendChild(option);
  });
}

function predictTrend() {
  const crop = document.getElementById("cropInput").value.trim();
  const county = document.getElementById("countySelect").value;
  const township = document.getElementById("townshipSelect").value;

  const priceTrend = document.getElementById("priceTrend");
  const supplyTrend = document.getElementById("supplyTrend");
  const climateTrend = document.getElementById("climateTrend");
  const aiSummary = document.getElementById("aiSummary");

  if (!crop) {
    priceTrend.innerHTML = "⚠️ 請先輸入作物名稱。";
    supplyTrend.innerHTML = "尚未預測";
    climateTrend.innerHTML = "尚未預測";
    aiSummary.innerHTML = "尚未預測";
    return;
  }

  if (!county || !township) {
    priceTrend.innerHTML = "⚠️ 請選擇產地縣市與鄉鎮。";
    supplyTrend.innerHTML = "尚未預測";
    climateTrend.innerHTML = "尚未預測";
    aiSummary.innerHTML = "尚未預測";
    return;
  }

  const result = buildTrendPrediction(crop, county, township, selectedPeriod);

  priceTrend.innerHTML = `
    <div class="risk-list">
      <div class="risk-item">
        <strong>預測方向：</strong>
        <span class="${result.priceClass}">${result.priceDirection}</span>
      </div>
      <div class="risk-item">
        <strong>預測信心：</strong>${result.priceConfidence}%
      </div>
      <div class="risk-item">
        <strong>價格解讀：</strong>${result.priceText}
      </div>
    </div>
  `;

  supplyTrend.innerHTML = `
    <div class="risk-list">
      <div class="risk-item">
        <strong>供給方向：</strong>
        <span class="${result.supplyClass}">${result.supplyDirection}</span>
      </div>
      <div class="risk-item">
        <strong>供給信心：</strong>${result.supplyConfidence}%
      </div>
      <div class="risk-item">
        <strong>供給解讀：</strong>${result.supplyText}
      </div>
    </div>
  `;

  climateTrend.innerHTML = `
    <div class="risk-list">
      <div class="risk-item">
        <strong>氣候風險：</strong>
        <span class="${result.climateClass}">${result.climateRisk}</span>
      </div>
      <div class="risk-item">
        <strong>風險來源：</strong>${result.climateText}
      </div>
    </div>
  `;

  aiSummary.innerHTML = `
    <p><strong>作物：</strong>${crop}</p>
    <p><strong>產地：</strong>${county}${township}</p>
    <p><strong>分析期間：</strong>近${selectedPeriod}天</p>

    <hr>

    <p><strong>🤖 AI綜合判讀：</strong></p>
    <p>${result.summary}</p>

    <p><strong>🌾 農民決策建議：</strong></p>
    <p>${result.advice}</p>

    <p><strong>🎓 教學提問：</strong></p>
    <p>${result.question}</p>
  `;
}

function buildTrendPrediction(crop, county, township, period) {
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

  let priceDirection = "➡ 持平整理";
  let supplyDirection = "➡ 供給穩定";
  let climateRisk = "中";
  let priceConfidence = 62;
  let supplyConfidence = 60;

  let priceText = "目前以教學模擬邏輯判斷，價格可能維持整理。";
  let supplyText = "供應量暫時沒有明顯增加或減少訊號。";
  let climateText = "需搭配中央氣象署一週預報與颱風資訊進一步確認。";
  let summary = "目前市場與氣候訊號偏中性，建議先觀察價格與交易量變化。";
  let advice = "建議維持正常出貨，避免只依單一價格做重大決策。";
  let question = "如果價格持平，但氣候風險上升，農民應該如何調整出貨策略？";

  if (isSouth && isFruit) {
    priceDirection = "↗ 可能上升";
    supplyDirection = "↘ 供給可能減少";
    climateRisk = "中高";
    priceConfidence = 76;
    supplyConfidence = 72;

    priceText = "南部果樹若遇高溫或採收風險，短期供給可能受影響，價格有上升機會。";
    supplyText = "若高溫或颱風風險增加，採收量可能下降，市場供應可能偏緊。";
    climateText = "南部果樹需注意高溫、日燒、颱風與採後保存風險。";
    summary = "價格有上升機會，但氣候風險也同步提高，屬於高風險高變動型市場。";
    advice = "建議分批採收、加強採後降溫，並觀察是否有颱風或豪雨警示。";
    question = "如果你是南部果農，面對價格可能上升但颱風風險增加，你會提前採收嗎？";
  }

  if (isEast && isFruit) {
    priceDirection = "↗ 可能上升";
    supplyDirection = "↘ 供給不穩定";
    climateRisk = "高";
    priceConfidence = 74;
    supplyConfidence = 70;

    priceText = "東部果樹產區若受颱風或豪雨影響，供給不穩定時可能推升價格。";
    supplyText = "東部地區受強風豪雨影響較明顯，供應波動可能較大。";
    climateText = "需特別注意颱風路徑、豪雨與道路運輸中斷風險。";
    summary = "市場可能因供給不穩而出現價格波動，但風險較高。";
    advice = "建議提前確認支架、防風與排水設施，避免災後品質損失。";
    question = "若價格上漲是因為災害造成供給減少，這樣的上漲對農民一定有利嗎？";
  }

  if (isLeafy) {
    priceDirection = "↗ 波動上升";
    supplyDirection = "↘ 供給易波動";
    climateRisk = "中高";
    priceConfidence = 72;
    supplyConfidence = 75;

    priceText = "葉菜類受高溫與降雨影響大，短期價格容易波動。";
    supplyText = "若連續降雨或高溫，葉菜採收與品質容易受影響，供應可能不穩。";
    climateText = "葉菜類需注意高溫萎凋、豪雨病害與採收困難。";
    summary = "葉菜類屬於高度受天氣影響作物，價格與供給都可能快速變動。";
    advice = "建議分批種植、注意排水與採收時間，降低氣候造成的損失。";
    question = "為什麼葉菜類價格常常比根莖類更容易受天氣影響？";
  }

  if (isRoot) {
    priceDirection = "➡ 持平整理";
    supplyDirection = "➡ 供給相對穩定";
    climateRisk = "中";
    priceConfidence = 64;
    supplyConfidence = 68;

    priceText = "根莖類作物相對穩定，短期價格波動通常較小。";
    supplyText = "除非遇到連續豪雨或田區積水，否則供應通常較穩定。";
    climateText = "仍需注意連續降雨造成採收困難與儲藏品質下降。";
    summary = "根莖類短期市場較穩定，但仍需留意雨後採收與保存問題。";
    advice = "建議觀察儲藏品質與批發價格，再安排出貨節奏。";
    question = "根莖類作物為何比葉菜類更適合做儲藏與延後出貨？";
  }

  if (period === 90) {
    priceConfidence = Math.max(50, priceConfidence - 8);
    supplyConfidence = Math.max(50, supplyConfidence - 8);
    summary += " 由於分析期間較長，預測信心會略低，較適合看長期方向，不適合判斷單週價格。";
  }

  return {
    priceDirection,
    supplyDirection,
    climateRisk,
    priceConfidence,
    supplyConfidence,
    priceText,
    supplyText,
    climateText,
    summary,
    advice,
    question,
    priceClass: getTrendClass(priceDirection),
    supplyClass: getTrendClass(supplyDirection),
    climateClass: getClimateClass(climateRisk)
  };
}

function getTrendClass(text) {
  if (text.includes("上升")) return "risk-high";
  if (text.includes("減少") || text.includes("不穩")) return "risk-mid";
  return "risk-low";
}

function getClimateClass(level) {
  if (level.includes("高")) return "risk-high";
  if (level.includes("中")) return "risk-mid";
  return "risk-low";
}