const climateEvents = [
"颱風逼近產區",
"豪雨特報發布",
"持續乾旱",
"氣候穩定",
"寒流來襲"
];

const marketEvents = [
"日本訂單增加",
"中國需求下降",
"超市促銷活動",
"出口市場開放",
"進口農產品增加"
];

const costEvents = [
"肥料價格上漲15%",
"油價上漲",
"運費增加",
"冷鏈補助啟動",
"包裝成本提高"
];

const farmEvents = [
"採收人力不足",
"冷藏設備故障",
"加工廠合作邀約",
"品質認證通過",
"產區病蟲害增加"
];


const cropPool = [
  { crop: "芒果", county: "屏東縣", township: "枋山鄉", prices: [45, 55, 65, 75] },
  { crop: "香蕉", county: "高雄市", township: "旗山區", prices: [18, 25, 30, 38] },
  { crop: "鳳梨", county: "屏東縣", township: "內埔鄉", prices: [25, 35, 42, 50] },
  { crop: "甘藍", county: "雲林縣", township: "西螺鎮", prices: [12, 18, 25, 32] },
  { crop: "蓮霧", county: "屏東縣", township: "南州鄉", prices: [55, 75, 95, 120] },
  { crop: "番茄", county: "台南市", township: "新化區", prices: [28, 40, 55, 70] },
  { crop: "木瓜", county: "屏東縣", township: "九如鄉", prices: [20, 30, 42, 55] },
  { crop: "洋蔥", county: "屏東縣", township: "恆春鎮", prices: [18, 25, 35, 45] },
  { crop: "西瓜", county: "台南市", township: "學甲區", prices: [12, 18, 25, 32] },
  { crop: "番石榴", county: "高雄市", township: "燕巢區", prices: [25, 35, 48, 60] }
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDynamicQuestion() {
  const cropData = pickRandom(cropPool);
  const price = pickRandom(cropData.prices);
  const trend = pickRandom(["up", "flat", "down"]);
  const weatherRisk = pickRandom(["low", "mid", "high"]);
  const supply = pickRandom(["tight", "normal", "large"]);

  const climate = pickRandom(climateEvents);
  const market = pickRandom(marketEvents);
  const cost = pickRandom(costEvents);
  const farm = pickRandom(farmEvents);

  let profits = { A: 6, B: 6, C: 8, D: 5 };

  if (trend === "up") {
    profits.B += 5;
    profits.C += 4;
  }

  if (trend === "down") {
    profits.A += 5;
    profits.D += 4;
    profits.B -= 6;
  }

  if (weatherRisk === "high") {
    profits.A += 6;
    profits.C += 3;
    profits.B -= 8;
  }

  if (weatherRisk === "low") {
    profits.B += 3;
  }

  if (supply === "large") {
    profits.D += 7;
    profits.C += 4;
    profits.A -= 2;
  }

  if (supply === "tight") {
    profits.B += 4;
    profits.C += 3;
  }

  if (climate.includes("颱風") || climate.includes("豪雨") || climate.includes("寒流")) {
    profits.A += 4;
    profits.B -= 5;
    profits.C += 2;
  }

  if (climate.includes("乾旱")) {
    profits.B -= 2;
    profits.C += 2;
  }

  if (market.includes("訂單增加") || market.includes("市場開放") || market.includes("促銷")) {
    profits.B += 3;
    profits.C += 4;
  }

  if (market.includes("需求下降") || market.includes("進口")) {
    profits.A += 2;
    profits.D += 4;
    profits.B -= 3;
  }

  if (cost.includes("上漲") || cost.includes("增加") || cost.includes("提高")) {
    profits.C -= 2;
    profits.D -= 1;
  }

  if (cost.includes("補助")) {
    profits.D += 4;
  }

  if (farm.includes("人力不足") || farm.includes("故障") || farm.includes("病蟲害")) {
    profits.A += 3;
    profits.B -= 4;
  }

  if (farm.includes("加工廠")) {
    profits.D += 5;
  }

  if (farm.includes("認證")) {
    profits.B += 3;
    profits.C += 3;
  }

  Object.keys(profits).forEach(k => {
    profits[k] = Math.round(profits[k]);
  });

  const bestChoice = Object.keys(profits).sort((a, b) => profits[b] - profits[a])[0];

  const choiceText = {
    A: "立即採收",
    B: "延後採收",
    C: "分批採收",
    D: "加工利用"
  };

  return {
    crop: cropData.crop,
    county: cropData.county,
    township: cropData.township,
    price,
    trend,
    weatherRisk,
    supply,
    climate,
    market,
    cost,
    farm,
    profits,
    bestChoice,
    scenario: `
      ${cropData.crop}目前價格為 ${price} 元／公斤。
      氣候事件：${climate}。
      市場事件：${market}。
      成本事件：${cost}。
      農場事件：${farm}。
      請判斷最適合的出貨策略。
    `,
    explanation: `本題最佳策略為「${choiceText[bestChoice]}」，因為在目前價格、供給、氣候與事件條件下，預估獲利最高。`
  };
}


let townshipData = {};
let currentQuestion = null;
let questionAnswered = false;

window.addEventListener("DOMContentLoaded", async () => {
  await loadTownships();

  document.getElementById("countySelect").addEventListener("change", updateTownships);
  document.getElementById("simulateBtn").addEventListener("click", simulateDecision);
  document.getElementById("randomQuestionBtn")
          .addEventListener("click", randomQuestion);
  document.getElementById("clearBtn").addEventListener("click", clearDecision);
  document.getElementById("certificateBtn").addEventListener("click", generateCertificate);
});

  document.querySelectorAll(".choice-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    submitStudentChoice(btn.dataset.choice);
    renderAbilityReport();
  });
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

  currentQuestion = null;

  questionAnswered = false;

  playerStats = {
     market: 0,
     risk: 0,
     management: 0,
     totalQuestions: 0
  };

  document.getElementById("abilityReport").innerHTML = "尚未完成評量";

  document.getElementById("certificateBox").innerHTML =
      "完成 5 題以上評量後，可產生學習證書。";

  document.getElementById("challengeBox").classList.add("hidden");
  document.getElementById("challengeText").innerHTML = "請先按「AI隨機出題」。";
  document.getElementById("challengeResult").innerHTML = "";

  document.querySelectorAll(".choice-btn").forEach(btn => {
    btn.classList.remove("active");
  });

}

function randomQuestion() {

  const q = generateDynamicQuestion();

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

  currentQuestion = q;
  questionAnswered = false;

  document.getElementById("challengeBox").classList.remove("hidden");

  document.getElementById("challengeText").innerHTML =
  `情境題：${q.crop}｜${q.county}${q.township}｜目前價格 ${q.price} 元／公斤。<br>${q.scenario}`;

  document.getElementById("challengeResult").innerHTML = "";

  document.querySelectorAll(".choice-btn").forEach(btn => {
     btn.classList.remove("active");
});

  document.getElementById("eventCards").classList.remove("hidden");
  document.getElementById("climateEvent").textContent = q.climate;
  document.getElementById("marketEvent").textContent = q.market;
  document.getElementById("costEvent").textContent = q.cost;
  document.getElementById("farmEvent").textContent = q.farm;


}

function submitStudentChoice(choice) {
  if (!currentQuestion) {
    document.getElementById("challengeResult").innerHTML =
      "⚠️ 請先按「AI隨機出題」。";
    return;
  }

  document.querySelectorAll(".choice-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  document.querySelector(`.choice-btn[data-choice="${choice}"]`)
    .classList.add("active");

  const profit = currentQuestion.profits[choice];
  const best = currentQuestion.bestChoice;
  const bestProfit = currentQuestion.profits[best];

  const choiceName = {
    A: "立即採收",
    B: "延後採收",
    C: "分批採收",
    D: "加工利用"
  };

  document.getElementById("challengeResult").innerHTML = `
    <p>你的選擇：${choice}｜${choiceName[choice]}</p>
    <p>模擬結果：獲利 ${profit >= 0 ? "+" : ""}${profit} 萬元</p>
    <p>最佳方案：${best}｜${choiceName[best]}，獲利 ${bestProfit >= 0 ? "+" : ""}${bestProfit} 萬元</p>
    <p>解析：${currentQuestion.explanation}</p>
  `;

  renderChallengeAiDecision(choice);

   if (!questionAnswered) {
  playerStats.totalQuestions++;

  if (choice === currentQuestion.bestChoice) {
    playerStats.market += 10;
    playerStats.risk += 10;
    playerStats.management += 10;
  } else {
    playerStats.market += 6;
    playerStats.risk += 5;
    playerStats.management += 4;
  }

  questionAnswered = true;
}

}  // ✅ 補這個，結束 submitStudentChoice 函式

function renderChallengeAiDecision(choice) {
  const q = currentQuestion;

  const choiceName = {
    A: "立即採收出貨",
    B: "延後採收出貨",
    C: "分批採收銷售",
    D: "加工或冷藏利用"
  };

  const best = q.bestChoice;

  document.getElementById("optionA").innerHTML = `
  <p><strong>模擬獲利：</strong>${q.profits.A >= 0 ? "+" : ""}${q.profits.A} 萬元</p>
  <p><strong>判斷：</strong>立即採收可降低等待風險，但可能錯過較佳價格。</p>
`;

document.getElementById("optionB").innerHTML = `
  <p><strong>模擬獲利：</strong>${q.profits.B >= 0 ? "+" : ""}${q.profits.B} 萬元</p>
  <p><strong>判斷：</strong>延後採收可能等待較好價格，但需承擔氣候與品質風險。</p>
`;

document.getElementById("optionC").innerHTML = `
  <p><strong>模擬獲利：</strong>${q.profits.C >= 0 ? "+" : ""}${q.profits.C} 萬元</p>
  <p><strong>判斷：</strong>分批採收可分散風險，兼顧收益與安全性。</p>
`;

document.getElementById("optionD").innerHTML = `
  <p><strong>模擬獲利：</strong>${q.profits.D >= 0 ? "+" : ""}${q.profits.D} 萬元</p>
  <p><strong>判斷：</strong>加工或冷藏可降低集中出貨壓力，增加附加價值。</p>
`;


  document.getElementById("statusText").innerHTML =
    `已完成「${q.crop}」AI隨機情境決策挑戰。`;

  document.getElementById("aiDecision").innerHTML = `
    <p><strong>作物：</strong>${q.crop}</p>
    <p><strong>產地：</strong>${q.county}${q.township}</p>
    <p><strong>目前價格：</strong>${q.price} 元／公斤</p>
    <p><strong>你的選擇：</strong>${choice}｜${choiceName[choice]}</p>
    <p><strong>你的獲利：</strong>${q.profits[choice] >= 0 ? "+" : ""}${q.profits[choice]} 萬元</p>

    <hr>

    <p><strong>AI最佳方案：</strong>
      <span class="success-text">${best}｜${choiceName[best]}</span>
    </p>
    <p><strong>最佳獲利：</strong>${q.profits[best] >= 0 ? "+" : ""}${q.profits[best]} 萬元</p>
    <p><strong>AI解析：</strong>${q.explanation}</p>
  `;

  document.getElementById("teacherQuestion").innerHTML = `
    <p><strong>討論題 1：</strong>你同意 AI 的最佳方案嗎？為什麼？</p>
    <p><strong>討論題 2：</strong>如果氣候風險提高，你會改選哪一個方案？</p>
    <p><strong>討論題 3：</strong>除了 ${choiceName[best]}，還有沒有其他可能策略？</p>
  `;
}

let playerStats = {
  market: 0,
  risk: 0,
  management: 0,
  totalQuestions: 0
};

function renderAbilityReport(){

const market =
Math.min(playerStats.market,100);

const risk =
Math.min(playerStats.risk,100);

const management =
Math.min(playerStats.management,100);

const total =
Math.round(
(market+risk+management)/3
);

let level="C";

if(total>=90) level="S";
else if(total>=80) level="A";
else if(total>=70) level="B";

document.getElementById("abilityReport")
.innerHTML = `

<p>📈 市場判讀能力：${market}</p>

<p>🌪 風險管理能力：${risk}</p>

<p>🚜 經營決策能力：${management}</p>

<hr>

<p>
🏆 綜合評等：
<strong>${level}</strong>
</p>

<p>
累積完成題數：
${playerStats.totalQuestions} 題
</p>

`;

}

function generateCertificate() {
  if (playerStats.totalQuestions < 5) {
    document.getElementById("certificateBox").innerHTML =
      `⚠️ 請先完成至少 5 題評量，目前完成 ${playerStats.totalQuestions} 題。`;
    return;
  }

  const market = Math.min(playerStats.market, 100);
  const risk = Math.min(playerStats.risk, 100);
  const management = Math.min(playerStats.management, 100);
  const total = Math.round((market + risk + management) / 3);

  let level = "C";
  if (total >= 90) level = "S";
  else if (total >= 80) level = "A";
  else if (total >= 70) level = "B";

  const today = new Date().toLocaleDateString("zh-TW");

  document.getElementById("certificateBox").innerHTML = `
    <div class="certificate">
      <div class="certificate-org"><h2>AI農業教育中心</h2></div>
      <h2>🏅 AI農業經營決策學習證書</h2>

      <p>茲證明學習者已完成</p>
      <h3>農業經營決策與風險管理模擬評量</h3>

      <div class="certificate-score">
        <p>📈 市場判讀能力：${market}</p>
        <p>🌪 風險管理能力：${risk}</p>
        <p>🚜 經營決策能力：${management}</p>
        <p>🏆 綜合評等：${level}</p>
        <p>完成題數：${playerStats.totalQuestions} 題</p>
      </div>

      <p class="certificate-date">授證日期：${today}</p>
    </div>
  `;
}