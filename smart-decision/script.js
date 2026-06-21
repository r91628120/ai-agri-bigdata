let currentSimulation = null;
let simulationCount = 0;
let decisionAnswered = false;

const events = {
  climate: ["天氣穩定", "連續豪雨", "高溫乾旱", "颱風接近", "寒流影響"],
  market: ["市場價格穩定", "價格上漲", "價格下跌", "大量上市", "外銷訂單增加"],
  labor: ["人力充足", "臨時缺工", "工資上漲", "採收人力不足", "包裝人力不足"]
};

const cropPestEvents = {
  "水稻": ["無重大病蟲害", "負泥蟲危害增加", "螟蟲危害增加", "褐飛蝨密度升高", "稻苞蟲危害增加", "紋枯病風險升高", "稻熱病風險升高"],
  "芒果": ["無重大病蟲害", "果實蠅風險升高", "炭疽病風險升高", "薊馬危害增加", "介殼蟲危害增加"],
  "香蕉": ["無重大病蟲害", "葉斑病風險升高", "香蕉弄蝶危害增加", "蚜蟲危害增加"],
  "鳳梨": ["無重大病蟲害", "粉介殼蟲危害增加", "心腐病風險升高", "葉部病害增加"],
  "高麗菜": ["無重大病蟲害", "小菜蛾危害增加", "斜紋夜蛾危害增加", "蚜蟲危害增加", "黑腐病風險升高"],
  "洋蔥": ["無重大病蟲害", "薊馬危害增加", "紫斑病風險升高", "露菌病風險升高"],
  "蓮霧": ["無重大病蟲害", "果實蠅風險升高", "薊馬危害增加", "炭疽病風險升高", "介殼蟲危害增加"]
};

const cropBase = {
  "水稻": { price: 28, yield: 6000, cost: 85000 },
  "芒果": { price: 65, yield: 9000, cost: 140000 },
  "香蕉": { price: 32, yield: 18000, cost: 120000 },
  "鳳梨": { price: 38, yield: 22000, cost: 150000 },
  "高麗菜": { price: 24, yield: 26000, cost: 110000 },
  "洋蔥": { price: 30, yield: 20000, cost: 100000 },
  "蓮霧": { price: 80, yield: 8000, cost: 160000 }
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getText(id) {
  return document.getElementById(id).value;
}

function getMethodName(method) {
  if (method === "organic") return "有機農法";
  if (method === "friendly") return "友善農法";
  return "慣行農法";
}

function getLevelName(level) {
  if (level === "high") return "高";
  if (level === "low") return "低";
  return "中";
}

function updateDashboardBasic() {
  const crop = getText("cropSelect");
  const area = Number(getText("areaSelect"));
  const method = getText("methodSelect");
  const fertilizer = getText("fertilizerSelect");
  const labor = getText("laborSelect");
  const equipment = getText("equipmentSelect");

  const base = cropBase[crop];
  let cost = base.cost * area;

  if (method === "organic") cost *= 1.18;
  if (method === "friendly") cost *= 1.08;
  if (fertilizer === "high") cost *= 1.08;
  if (labor === "high") cost *= 1.1;
  if (equipment === "high") cost *= 1.12;

  document.getElementById("dashCrop").textContent = crop;
  document.getElementById("dashArea").textContent = area + " 甲地";
  document.getElementById("dashMethod").textContent = getMethodName(method);
  document.getElementById("dashCost").textContent = Math.round(cost).toLocaleString() + " 元";
  document.getElementById("dashRisk").textContent = "模擬中";
  document.getElementById("dashStatus").textContent = "等待決策";
}


function runSimulation() {
  const crop = getText("cropSelect");
  const area = Number(getText("areaSelect"));
  const method = getText("methodSelect");
  const fertilizer = getText("fertilizerSelect");
  const labor = getText("laborSelect");
  const equipment = getText("equipmentSelect");

  const climateEvent = pickRandom(events.climate);
  const marketEvent = pickRandom(events.market);
  const pestEvent = pickRandom(cropPestEvents[crop] || ["無重大病蟲害", "病蟲害輕微"]);
  const laborEvent = pickRandom(events.labor);

  currentSimulation = {
    crop,
    area,
    method,
    fertilizer,
    labor,
    equipment,
    climateEvent,
    marketEvent,
    pestEvent,
    laborEvent
  };

   decisionAnswered = false;
   updateDashboardBasic();

  document.getElementById("eventBox").innerHTML = `
    <strong>🌱 作物：</strong>${crop}<br>
    <strong>📐 面積：</strong>${area} 甲地<br>
    <strong>🌾 種植方式：</strong>${getMethodName(method)}<br><br>
    <strong>🌦 氣候事件：</strong>${climateEvent}<br>
    <strong>📈 市場事件：</strong>${marketEvent}<br>
    <strong>🐛 病蟲害事件：</strong>${pestEvent}<br>
    <strong>👷 人力事件：</strong>${laborEvent}
  `;

  document.getElementById("decisionResult").innerHTML =
    "請根據事件選擇一個農場經營決策。";

  document.getElementById("businessResult").innerHTML =
    "等待學生選擇決策後產生結果。";

  document.getElementById("abilityReport").innerHTML =
    "等待決策完成後產生能力評量。";

  document.getElementById("teacherQuestion").innerHTML =
    "等待決策完成後產生討論題。";

  document.getElementById("certificateBox").innerHTML =
    "完成本次模擬後，可產生學習成果。";
}

function makeDecision(choice) {
  if (!currentSimulation) {
    document.getElementById("decisionResult").innerHTML =
      "請先按「🎲 開始模擬」，再選擇決策。";
    return;
  }

  
  const base = cropBase[currentSimulation.crop];
  let price = base.price;
  let yieldAmount = base.yield * currentSimulation.area;
  let cost = base.cost * currentSimulation.area;
  let risk = 30;
  let decisionName = "";
  let comment = "";

  if (currentSimulation.marketEvent.includes("上漲")) price *= 1.25;
  if (currentSimulation.marketEvent.includes("下跌")) price *= 0.78;
  if (currentSimulation.marketEvent.includes("大量")) price *= 0.72;
  if (currentSimulation.marketEvent.includes("外銷")) price *= 1.18;

  if (currentSimulation.climateEvent.includes("豪雨")) {
    yieldAmount *= 0.82;
    risk += 18;
  }
  if (currentSimulation.climateEvent.includes("乾旱")) {
    yieldAmount *= 0.78;
    risk += 22;
  }
  if (currentSimulation.climateEvent.includes("颱風")) {
    yieldAmount *= 0.68;
    risk += 30;
  }
  if (currentSimulation.climateEvent.includes("寒流")) {
    yieldAmount *= 0.86;
    risk += 14;
  }

  if (currentSimulation.pestEvent.includes("擴散")) {
    yieldAmount *= 0.78;
    risk += 22;
  }
  
  if (
  currentSimulation.pestEvent.includes("果實蠅") ||
  currentSimulation.pestEvent.includes("褐飛蝨") ||
  currentSimulation.pestEvent.includes("螟蟲") ||
  currentSimulation.pestEvent.includes("負泥蟲") ||
  currentSimulation.pestEvent.includes("稻苞蟲") ||
  currentSimulation.pestEvent.includes("小菜蛾") ||
  currentSimulation.pestEvent.includes("斜紋夜蛾") ||
  currentSimulation.pestEvent.includes("薊馬") ||
  currentSimulation.pestEvent.includes("介殼蟲") ||
  currentSimulation.pestEvent.includes("粉介殼蟲")
) {
  yieldAmount *= 0.84;
  risk += 18;
}

if (
  currentSimulation.pestEvent.includes("葉部") ||
  currentSimulation.pestEvent.includes("紋枯病") ||
  currentSimulation.pestEvent.includes("稻熱病") ||
  currentSimulation.pestEvent.includes("炭疽病") ||
  currentSimulation.pestEvent.includes("葉斑病") ||
  currentSimulation.pestEvent.includes("心腐病") ||
  currentSimulation.pestEvent.includes("黑腐病") ||
  currentSimulation.pestEvent.includes("紫斑病") ||
  currentSimulation.pestEvent.includes("露菌病")
) {
  yieldAmount *= 0.88;
  risk += 12;
}

  if (currentSimulation.laborEvent.includes("缺工") || currentSimulation.laborEvent.includes("不足")) {
    cost *= 1.16;
    risk += 12;
  }
  if (currentSimulation.laborEvent.includes("工資")) {
    cost *= 1.12;
    risk += 8;
  }

  if (currentSimulation.method === "organic") {
    price *= 1.18;
    cost *= 1.18;
  }

  if (currentSimulation.method === "friendly") {
    price *= 1.08;
    cost *= 1.08;
  }

  if (currentSimulation.fertilizer === "high") cost *= 1.08;
  if (currentSimulation.labor === "high") cost *= 1.1;
  if (currentSimulation.equipment === "high") cost *= 1.12;

  if (choice === "A") {
    decisionName = "增加防治";
    cost *= 1.12;
    yieldAmount *= 1.05;
    risk -= 12;
    comment = "你選擇提高防治投入，能降低病蟲害與品質風險，但成本也會增加。";
  }

  if (choice === "B") {
    decisionName = "維持原計畫";
    risk += 6;
    comment = "你選擇維持原計畫，成本較穩定，但若外部風險升高，可能承受較大損失。";
  }

  if (choice === "C") {
    decisionName = "提前採收";
    yieldAmount *= 0.9;
    risk -= 18;
    comment = "你選擇提前採收，可降低氣候災損風險，但產量與品質可能略受影響。";
  }

  if (choice === "D") {
    decisionName = "加工利用";
    price *= 1.12;
    cost *= 1.15;
    risk -= 8;
    comment = "你選擇加工利用，能提升附加價值並分散市場風險，但加工與包裝成本會提高。";
  }

  risk = Math.max(5, Math.min(95, Math.round(risk)));

  let riskLevel = "低";
    if (risk >= 60) riskLevel = "高";
    else if (risk >= 35) riskLevel = "中";

   document.getElementById("dashRisk").textContent = riskLevel + "（" + risk + "%）";
  

  const income = Math.round(price * yieldAmount);
  const profit = Math.round(income - cost);
  const profitRate = Math.round((profit / income) * 100);

  if (!decisionAnswered) {
       simulationCount++;
       decisionAnswered = true;
  }

  document.getElementById("dashStatus").textContent =
  profit > 0 ? "獲利經營" : "需要調整";


  document.getElementById("decisionResult").innerHTML = `
    <strong>你的決策：</strong>${decisionName}<br>
    ${comment}
  `;

  document.getElementById("businessResult").innerHTML = `
    <strong>預估收入：</strong>${income.toLocaleString()} 元<br>
    <strong>預估成本：</strong>${Math.round(cost).toLocaleString()} 元<br>
    <strong>預估淨利：</strong>${profit.toLocaleString()} 元<br>
    <strong>淨利率：</strong>${profitRate}%<br>
    <strong>風險指數：</strong>${risk}%
  `;

  const marketScore = Math.max(50, 100 - Math.abs(60 - profitRate));
  const riskScore = Math.max(45, 100 - risk);
  const resourceScore = profit > 0 ? 82 : 58;
  const sustainableScore = currentSimulation.method === "organic" ? 90 :
    currentSimulation.method === "friendly" ? 82 : 70;

  document.getElementById("abilityReport").innerHTML = `
    <strong>市場判讀能力：</strong>${Math.round(marketScore)} 分<br>
    <strong>風險管理能力：</strong>${Math.round(riskScore)} 分<br>
    <strong>資源配置能力：</strong>${resourceScore} 分<br>
    <strong>永續經營能力：</strong>${sustainableScore} 分<br><br>
    <strong>AI評語：</strong>${profit > 0 ? "本次經營具有獲利能力，但仍需注意風險控管。" : "本次經營結果偏弱，建議重新檢討成本、採收時機與銷售策略。"}
  `;

  document.getElementById("teacherQuestion").innerHTML = `
    1. 如果市場價格再下跌 20%，你的決策會改變嗎？<br>
    2. 如果氣候風險升高，提前採收是否一定比較好？<br>
    3. 加工利用雖然提高價格，為什麼也可能降低獲利？<br>
    4. 友善或有機農法在經營上有哪些優勢與挑戰？
  `;

  document.getElementById("certificateBox").innerHTML = `
    🎉 已完成第 ${simulationCount} 次 AI智慧農業決策模擬。<br><br>
    <strong>學習成果：</strong><br>
    你已完成作物選擇、事件判讀、經營決策與風險分析。<br><br>
    ${simulationCount >= 10 ? "🏅 恭喜！已達成 AI農場經營能力證書門檻。" : "完成 10 次模擬後，可作為課堂學習證書依據。"}
  `;
}

function clearSimulation() {
  currentSimulation = null;
  decisionAnswered = false;

  document.getElementById("cropSelect").value = "水稻";
  document.getElementById("areaSelect").value = "0.1";
  document.getElementById("methodSelect").value = "conventional";
  document.getElementById("fertilizerSelect").value = "mid";
  document.getElementById("laborSelect").value = "mid";
  document.getElementById("equipmentSelect").value = "mid";

  document.getElementById("eventBox").innerHTML = "尚未產生事件。";
  document.getElementById("decisionResult").innerHTML = "請先開始模擬，再選擇決策。";
  document.getElementById("businessResult").innerHTML = "尚未產生經營結果。";
  document.getElementById("abilityReport").innerHTML = "尚未完成模擬。";
  document.getElementById("teacherQuestion").innerHTML = "尚未產生討論題。";
  document.getElementById("certificateBox").innerHTML = "完成模擬後，可產生學習成果。";
}

document.getElementById("dashCrop").textContent = "尚未設定";
document.getElementById("dashArea").textContent = "尚未設定";
document.getElementById("dashMethod").textContent = "尚未設定";
document.getElementById("dashRisk").textContent = "尚未模擬";
document.getElementById("dashCost").textContent = "尚未估算";
document.getElementById("dashStatus").textContent = "等待模擬";