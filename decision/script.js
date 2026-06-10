const questionBank = [
{
  crop: "芒果",
  county: "屏東縣",
  township: "枋山鄉",
  price: 55,
  trend: "up",
  weatherRisk: "low",
  supply: "normal"
},

{
  crop: "香蕉",
  county: "高雄市",
  township: "旗山區",
  price: 30,
  trend: "down",
  weatherRisk: "high",
  supply: "large"
},

{
  crop: "鳳梨",
  county: "屏東縣",
  township: "內埔鄉",
  price: 42,
  trend: "flat",
  weatherRisk: "mid",
  supply: "normal"
},

{
  crop: "甘藍",
  county: "雲林縣",
  township: "西螺鎮",
  price: 18,
  trend: "down",
  weatherRisk: "low",
  supply: "large"
},

{
  crop: "蓮霧",
  county: "屏東縣",
  township: "南州鄉",
  price: 75,
  trend: "up",
  weatherRisk: "mid",
  supply: "tight"
}
];

let townshipData = {};

window.addEventListener("DOMContentLoaded", async () => {
  await loadTownships();

  document.getElementById("countySelect").addEventListener("change", updateTownships);
  document.getElementById("simulateBtn").addEventListener("click", simulateDecision);
  document.getElementById("randomQuestionBtn")
          .addEventListener("click", randomQuestion);
  document.getElementById("clearBtn").addEventListener("click", clearDecision);
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

  townshipData[county].forEach(town => {
    const option = document.createElement("option");
    option.value = town;
    option.textContent = town;
    townshipSelect.appendChild(option);
  });
}

function simulateDecision() {
  const crop = document.getElementById("cropInput").value.trim();
  const county = document.getElementById("countySelect").value;
  const township = document.getElementById("townshipSelect").value;
  const price = Number(document.getElementById("priceInput").value);
  const trend = document.getElementById("trendSelect").value;
  const weatherRisk = document.getElementById("weatherRiskSelect").value;
  const supply = document.getElementById("supplySelect").value;

  if (!crop || !county || !township || !price) {
    document.getElementById("statusText").innerHTML =
      "⚠️ 請完整輸入作物、產地與目前平均價格。";
    return;
  }

  const result = buildDecisionResult({
    crop,
    county,
    township,
    price,
    trend,
    weatherRisk,
    supply
  });

  document.getElementById("statusText").innerHTML =
    `已完成「${crop}」農民決策模擬。`;

  document.getElementById("optionA").innerHTML = result.optionA;
  document.getElementById("optionB").innerHTML = result.optionB;
  document.getElementById("optionC").innerHTML = result.optionC;
  document.getElementById("optionD").innerHTML = result.optionD;
  document.getElementById("aiDecision").innerHTML = result.aiDecision;
  document.getElementById("teacherQuestion").innerHTML = result.teacherQuestion;
}

function buildDecisionResult(data) {
  const { crop, county, township, price, trend, weatherRisk, supply } = data;

  const trendText = {
    up: "可能上升",
    flat: "持平整理",
    down: "可能下降"
  }[trend];

  const weatherText = {
    low: "低",
    mid: "中",
    high: "高"
  }[weatherRisk];

  const supplyText = {
    tight: "供給偏少",
    normal: "供給正常",
    large: "大量上市"
  }[supply];

  let optionAScore = 70;
  let optionBScore = 65;
  let optionCScore = 80;
  let optionDScore = 60;

  if (trend === "up") {
    optionBScore += 10;
    optionCScore += 8;
  }

  if (trend === "down") {
    optionAScore += 10;
    optionDScore += 8;
  }

  if (weatherRisk === "high") {
    optionAScore += 12;
    optionCScore += 6;
    optionBScore -= 18;
  }

  if (weatherRisk === "low") {
    optionBScore += 8;
  }

  if (supply === "large") {
    optionDScore += 15;
    optionCScore += 8;
    optionAScore -= 5;
  }

  if (supply === "tight") {
    optionBScore += 8;
    optionCScore += 5;
  }

  const scores = [
    { name: "立即採收出貨", key: "A", score: optionAScore },
    { name: "延後採收出貨", key: "B", score: optionBScore },
    { name: "分批採收銷售", key: "C", score: optionCScore },
    { name: "加工或冷藏利用", key: "D", score: optionDScore }
  ];

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  const optionA = `
    <p><strong>適用情境：</strong>氣候風險升高、價格可能下跌，或品質保存風險增加時。</p>
    <p><strong>優點：</strong>可快速回收資金，降低災害或價格下跌風險。</p>
    <p><strong>缺點：</strong>若後續價格上漲，可能錯過較佳收益。</p>
    <span class="decision-score">決策分數：${optionAScore}</span>
  `;

  const optionB = `
    <p><strong>適用情境：</strong>價格趨勢可能上升，且氣候風險較低時。</p>
    <p><strong>優點：</strong>有機會取得更高價格。</p>
    <p><strong>缺點：</strong>若遇豪雨、颱風或品質下降，可能造成損失。</p>
    <span class="decision-score">決策分數：${optionBScore}</span>
  `;

  const optionC = `
    <p><strong>適用情境：</strong>價格與氣候都有不確定性時。</p>
    <p><strong>優點：</strong>可分散風險，兼顧部分收益與安全性。</p>
    <p><strong>缺點：</strong>人工、運輸與管理成本可能增加。</p>
    <span class="decision-score">決策分數：${optionCScore}</span>
  `;

  const optionD = `
    <p><strong>適用情境：</strong>大量上市、價格偏低或品質規格不一時。</p>
    <p><strong>優點：</strong>可降低低價出清壓力，增加附加價值。</p>
    <p><strong>缺點：</strong>需要加工設備、冷藏成本或通路能力。</p>
    <span class="decision-score">決策分數：${optionDScore}</span>
  `;

  const aiDecision = `
    <p><strong>作物：</strong>${crop}</p>
    <p><strong>產地：</strong>${county}${township}</p>
    <p><strong>目前價格：</strong>${price} 元／公斤</p>
    <p><strong>價格趨勢：</strong>${trendText}</p>
    <p><strong>氣候風險：</strong>${weatherText}</p>
    <p><strong>供給狀態：</strong>${supplyText}</p>

    <hr>

    <p><strong>AI推薦方案：</strong>
      <span class="success-text">${best.key}｜${best.name}</span>
    </p>

    <p>
      本次模擬中，${best.name} 的綜合分數最高。
      主要判斷依據為價格趨勢、氣候風險與供給狀態。
    </p>
  `;

  const teacherQuestion = `
    <p><strong>討論題 1：</strong>如果你是農民，會選擇 AI 推薦的方案嗎？為什麼？</p>
    <p><strong>討論題 2：</strong>若氣候風險從「中」提高到「高」，你的決策會如何改變？</p>
    <p><strong>討論題 3：</strong>若市場進入大量上市，除了降價出售，還有哪些處理方式？</p>
  `;

  return {
    optionA,
    optionB,
    optionC,
    optionD,
    aiDecision,
    teacherQuestion
  };
}

function clearDecision() {
  document.getElementById("cropInput").value = "";
  document.getElementById("countySelect").value = "";
  document.getElementById("townshipSelect").innerHTML =
    `<option value="">請先選擇縣市</option>`;
  document.getElementById("priceInput").value = "";
  document.getElementById("trendSelect").value = "up";
  document.getElementById("weatherRiskSelect").value = "mid";
  document.getElementById("supplySelect").value = "normal";

  document.getElementById("statusText").innerHTML = "尚未進行決策模擬。";
  document.getElementById("optionA").innerHTML = "尚未模擬。";
  document.getElementById("optionB").innerHTML = "尚未模擬。";
  document.getElementById("optionC").innerHTML = "尚未模擬。";
  document.getElementById("optionD").innerHTML = "尚未模擬。";
  document.getElementById("aiDecision").innerHTML = "尚未產生建議。";
  document.getElementById("teacherQuestion").innerHTML = "尚未產生討論題。";
}

function randomQuestion() {

  const q =
    questionBank[
      Math.floor(Math.random() * questionBank.length)
    ];

  document.getElementById("cropInput").value =
    q.crop;

  document.getElementById("countySelect").value =
    q.county;

  updateTownships();

  document.getElementById("townshipSelect").value =
    q.township;

  document.getElementById("priceInput").value =
    q.price;

  document.getElementById("trendSelect").value =
    q.trend;

  document.getElementById("weatherRiskSelect").value =
    q.weatherRisk;

  document.getElementById("supplySelect").value =
    q.supply;

  document.getElementById("statusText").innerHTML =
    `🎲 AI已產生一題農業經營情境，請先思考你會如何決策，再按「開始決策模擬」。`;
}