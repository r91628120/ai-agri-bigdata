let priceChartInstance = null;
let trendPeriod = 7;
let chartMode = "price";


function renderPriceChart(labels, prices, quantities, cropName) {
  const canvas = document.getElementById("priceChart");
  if (!canvas || typeof Chart === "undefined") return;

  if (priceChartInstance) {
    priceChartInstance.destroy();
  }

  let datasets = [];
  let scales = {};

  if (chartMode === "price") {
    datasets = [{
      label: `${cropName} 平均價（元/公斤）`,
      data: prices,
      borderWidth: 3,
      tension: 0.35,
      fill: true
    }];
  }

  if (chartMode === "quantity") {
    datasets = [{
      label: `${cropName} 交易量（公斤）`,
      data: quantities,
      borderWidth: 3,
      tension: 0.35,
      fill: true
    }];
  }

  if (chartMode === "dual") {
    datasets = [
      {
        label: `${cropName} 平均價（元/公斤）`,
        data: prices,
        borderWidth: 3,
        tension: 0.35,
        yAxisID: "y"
      },
      {
        label: `${cropName} 交易量（公斤）`,
        data: quantities,
        borderWidth: 3,
        tension: 0.35,
        yAxisID: "y1"
      }
    ];

    scales = {
      y: {
        type: "linear",
        position: "left",
        title: {
          display: true,
          text: "平均價（元/公斤）"
        }
      },
      y1: {
        type: "linear",
        position: "right",
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: "交易量（公斤）"
        }
      }
    };
  }

  priceChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales
    }
  });
}

   function setTrendPeriod(days) {

  trendPeriod = days;

  document
    .querySelectorAll(".period-btn")
    .forEach(btn => btn.classList.remove("active"));

  document
    .getElementById(`period${days}`)
    .classList.add("active");

}

 function setChartMode(mode) {
  chartMode = mode;

  document
    .querySelectorAll("#modePrice, #modeQuantity, #modeDual")
    .forEach(btn => btn.classList.remove("active"));

  if (mode === "price") {
    document.getElementById("modePrice").classList.add("active");
  }

  if (mode === "quantity") {
    document.getElementById("modeQuantity").classList.add("active");
  }

  if (mode === "dual") {
    document.getElementById("modeDual").classList.add("active");
  }
} 



// ===============================
// 📈 農產品即時行情查詢
// ===============================

async function loadAmisData() {
  const crop = document.getElementById("cropInput").value.trim();
  const market = document.getElementById("marketInput").value.trim();
  const status = document.getElementById("marketStatus");
  const tbody = document.getElementById("marketTableBody");

  status.innerHTML = "資料讀取中，請稍候...";
  tbody.innerHTML = "";

  if (!crop) {
    status.innerHTML = "⚠️ 請先輸入作物名稱，例如：甘藍、甘藍-初秋、芒果-愛文。";
    return;
  }

  try {
    const apiUrl = new URL("https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx");
    apiUrl.searchParams.set("$top", "500");
    apiUrl.searchParams.set("Crop", crop);

    if (market) {
      apiUrl.searchParams.set("Market", market);
    }

    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    const filteredData = data.filter(item => {
      const cropName = item["作物名稱"] || item.Crop || "";
      const marketName = item["市場名稱"] || item.Market || "";
      return cropName.includes(crop) && (!market || marketName.includes(market));
    });

    if (filteredData.length === 0) {
      status.innerHTML = `查無「${crop}」資料，請改用更完整名稱，例如：甘藍-初秋、芒果-愛文。`;
      return;
    }

    status.innerHTML = `已取得 ${filteredData.length} 筆「${crop}」行情資料。`;

    filteredData.slice(0, 30).forEach(item => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${item["交易日期"] || item.TransDate || "-"}</td>
        <td>${item["市場名稱"] || item.Market || "-"}</td>
        <td>${item["作物名稱"] || item.Crop || "-"}</td>
        <td>${item["上價"] || item.Upper_Price || "-"} 元/公斤</td>
        <td>${item["中價"] || item.Middle_Price || "-"} 元/公斤</td>
        <td>${item["下價"] || item.Lower_Price || "-"} 元/公斤</td>
        <td>${item["平均價"] || item.Avg_Price || "-"} 元/公斤</td>
        <td>${item["交易量"] || item.Trans_Quantity || "-"} 公斤</td>
      `;

      tbody.appendChild(row);
    });

  } catch (error) {
    console.error(error);
    status.innerHTML = "資料讀取失敗，可能是 API 暫時無法連線或瀏覽器限制。";
  }
}

  function formatRocDate(date) {
    const rocYear = date.getFullYear() - 1911;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
     return `${rocYear}.${month}.${day}`;
}


   async function analyzeTrend() {
  const crop = document.getElementById("trendCropInput").value.trim();
  const market = document.getElementById("trendMarketInput").value.trim();
  const status = document.getElementById("trendStatus");
  const aiText = document.getElementById("aiTrendText");
  const chartTitle = document.getElementById("trendChartTitle");

  status.innerHTML = "趨勢資料分析中，請稍候...";
  aiText.innerHTML = "資料讀取中...";

  if (!crop) {
    status.innerHTML = "⚠️ 請先輸入作物名稱，例如：芒果-愛文、苦瓜、甘藍。";
    return;
  }

  let allData = [];

  try {
    for (let skip = 0; skip < 5000; skip += 500) {
      const apiUrl = new URL("https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx");

      const endDate = new Date();
      const startDate = new Date();
            startDate.setDate(endDate.getDate() - (trendPeriod - 1));

            apiUrl.searchParams.set("$top", "500");
            apiUrl.searchParams.set("$skip", skip);
            apiUrl.searchParams.set("StartDate", formatRocDate(startDate));
            apiUrl.searchParams.set("EndDate", formatRocDate(endDate));
            apiUrl.searchParams.set("Crop", crop);

      if (market) {
        apiUrl.searchParams.set("Market", market);
      }

      const response = await fetch(apiUrl.toString());
      const pageData = await response.json();

      if (!Array.isArray(pageData) || pageData.length === 0) break;

      allData = allData.concat(pageData);

      if (pageData.length < 500) break;
    }

    const filteredData = allData.filter(item => {
      const cropName = item["作物名稱"] || item.Crop || "";
      const marketName = item["市場名稱"] || item.Market || "";
      return cropName.includes(crop) && (!market || marketName.includes(market));
    });

    if (filteredData.length === 0) {
      status.innerHTML = `查無「${crop}」趨勢資料，請改用更完整名稱，例如：芒果-愛文。`;
      aiText.innerHTML = "尚無可分析資料。";
      return;
    }

    const dailyMap = {};

    filteredData.forEach(item => {
      const date = item["交易日期"] || item.TransDate || "";
      const price = Number(item["平均價"] || item.Avg_Price || 0);
      const quantity = Number(item["交易量"] || item.Trans_Quantity || 0);

      if (!date || !price) return;

      if (!dailyMap[date]) {
        dailyMap[date] = {
          totalPrice: 0,
          count: 0,
          totalQuantity: 0
        };
      }

      dailyMap[date].totalPrice += price;
      dailyMap[date].count += 1;
      dailyMap[date].totalQuantity += quantity;
    });

    let trendData = Object.keys(dailyMap)
      .sort()
      .map(date => ({
        date,
        avgPrice: dailyMap[date].totalPrice / dailyMap[date].count,
        quantity: dailyMap[date].totalQuantity
      }));

    trendData = trendData.slice(-trendPeriod);

    if (trendData.length < 2) {
      status.innerHTML = `「${crop}」目前僅取得 ${trendData.length} 日資料，暫時無法形成趨勢圖。`;
      aiText.innerHTML = "建議改用更完整作物名稱，或稍後再查詢。";
      return;
    }

    const labels = trendData.map(item => item.date);
    const prices = trendData.map(item => Number(item.avgPrice.toFixed(1)));
    const quantities = trendData.map(item => Number(item.quantity || 0));

    renderPriceChart(labels, prices, quantities, crop);

    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changeRate = (change / firstPrice) * 100;

    const firstQuantity = trendData[0].quantity;
    const lastQuantity = trendData[trendData.length - 1].quantity;
    const quantityChangeRate = firstQuantity
      ? ((lastQuantity - firstQuantity) / firstQuantity) * 100
      : 0;

    let trendIcon = "➡️";
    let trendText = "價格大致持平";

    if (changeRate > 5) {
      trendIcon = "📈";
      trendText = "價格呈現上升趨勢";
    } else if (changeRate < -5) {
      trendIcon = "📉";
      trendText = "價格呈現下降趨勢";
    }

    let modeTitle = "價格趨勢";

    if (chartMode === "quantity") {
      modeTitle = "交易量趨勢";
    }

    if (chartMode === "dual") {
      modeTitle = "價格與交易量雙軸圖";
    }

    chartTitle.innerHTML = `${crop} 近${trendPeriod}天${modeTitle}`;

    status.innerHTML =
      `已完成近 ${trendData.length} 日「${crop}」價格趨勢分析。（目前可取得 ${trendData.length} 日資料）`;

    let supplyDemandText = "";
let farmerAdvice = "";
let studentQuestion = "";
let riskLevel = "低";

if (changeRate > 5 && quantityChangeRate < -5) {
  supplyDemandText = "價格上升、交易量下降，可能代表市場供應減少，價格受到支撐。";
  farmerAdvice = "可觀察是否進入採收尾聲，若品質穩定，可考慮分批出貨，提高平均售價。";
  studentQuestion = "為什麼交易量下降時，價格可能反而上升？";
  riskLevel = "中";
} else if (changeRate < -5 && quantityChangeRate > 5) {
  supplyDemandText = "價格下降、交易量上升，可能代表大量上市，市場供給增加造成價格壓力。";
  farmerAdvice = "建議評估分級銷售、加工利用或轉往其他通路，避免集中出貨造成價格下跌。";
  studentQuestion = "大量上市時，農民可以用哪些方式降低價格下跌風險？";
  riskLevel = "高";
} else if (changeRate > 5 && quantityChangeRate > 5) {
  supplyDemandText = "價格與交易量同步上升，可能代表市場需求增加，買氣較強。";
  farmerAdvice = "可注意市場是否持續有需求，若品質佳，可加強品牌包裝與通路銷售。";
  studentQuestion = "價格和交易量都上升時，可能代表市場發生什麼變化？";
  riskLevel = "低";
} else if (changeRate < -5 && quantityChangeRate < -5) {
  supplyDemandText = "價格與交易量同步下降，可能代表市場需求減弱或交易熱度降低。";
  farmerAdvice = "建議保守評估出貨時機，避免過度期待價格短期反彈。";
  studentQuestion = "價格與交易量都下降時，是否一定代表供給變少？";
  riskLevel = "中";
} else {
  supplyDemandText = "價格與交易量變化不明顯，市場短期可能處於整理或觀望狀態。";
  farmerAdvice = "可持續觀察後續行情，不宜只用單日價格做出重大決策。";
  studentQuestion = "如果價格變化不大，還可以觀察哪些市場訊號？";
  riskLevel = "低";
}

aiText.innerHTML = `
  <p><strong>${trendIcon} 市場趨勢：</strong>${trendText}</p>

  <ul>
    <li>起始平均價：${firstPrice.toFixed(1)} 元/公斤</li>
    <li>最新平均價：${lastPrice.toFixed(1)} 元/公斤</li>
    <li>價格變化：${change.toFixed(1)} 元，約 ${changeRate.toFixed(1)}%</li>
    <li>交易量變化：約 ${quantityChangeRate.toFixed(1)}%</li>
    <li>市場風險等級：<strong>${riskLevel}</strong></li>
  </ul>

  <hr>

  <p><strong>🤖 AI市場分析師判讀：</strong></p>
  <p>${supplyDemandText}</p>

  <p><strong>🌾 農民經營建議：</strong></p>
  <p>${farmerAdvice}</p>

  <p><strong>🎓 教學提問：</strong></p>
  <p>${studentQuestion}</p>
`;

  } catch (error) {
    console.error(error);
    status.innerHTML = "趨勢分析失敗，可能是 API 暫時無法連線或瀏覽器限制。";
    aiText.innerHTML = "請稍後再試。";
  }
}


function clearTrendAnalysis() {
  document.getElementById("trendCropInput").value = "";
  document.getElementById("trendMarketInput").value = "";
  document.getElementById("trendStatus").innerHTML = "尚未進行趨勢分析。";
  document.getElementById("trendChartTitle").innerHTML = "價格趨勢圖";
  document.getElementById("aiTrendText").innerHTML =
    "請輸入作物名稱後，系統會自動產生價格趨勢、漲跌幅、交易量與教學重點。";

  if (priceChartInstance) {
    priceChartInstance.destroy();
    priceChartInstance = null;
  }
}  


function clearAmisData() {
  document.getElementById("cropInput").value = "";
  document.getElementById("marketInput").value = "";
  document.getElementById("marketStatus").innerHTML = "尚未查詢資料。";
  document.getElementById("marketTableBody").innerHTML = "";
}

// ===============================
// 🌱 青農經營模擬器
// ===============================

function calculateProfit() {
  const price = Number(document.getElementById("priceInput").value);
  const yieldKg = Number(document.getElementById("yieldInput").value);
  const cost = Number(document.getElementById("costInput").value);
  const result = document.getElementById("result");

  if (!price || !yieldKg || !cost) {
    result.innerHTML = "⚠️ 請完整輸入每公斤價格、預估產量與總成本。";
    return;
  }

  const income = price * yieldKg;
  const profit = income - cost;
  const profitRate = income ? (profit / income) * 100 : 0;
  const balancePrice = cost / yieldKg;
  const safeSpace = price - balancePrice;
  const priceImpact = yieldKg;

  function money(num) {
    return Math.round(num).toLocaleString();
  }

  function percent(num) {
    return num.toFixed(1);
  }

  function rowPrice(p, label = "") {
    const rowIncome = p * yieldKg;
    const rowProfit = rowIncome - cost;
    return `
      <tr class="${p === price ? "current-row" : ""}">
        <td>${label || p.toFixed(1) + " 元"}</td>
        <td>${money(rowIncome)} 元</td>
        <td>${money(rowProfit)} 元</td>
      </tr>
    `;
  }

  function rowYield(rate, label) {
    const newYield = yieldKg * rate;
    const rowIncome = price * newYield;
    const rowProfit = rowIncome - cost;
    return `
      <tr class="${rate === 1 ? "current-row" : ""}">
        <td>${label}</td>
        <td>${money(newYield)} kg</td>
        <td>${money(rowIncome)} 元</td>
        <td>${money(rowProfit)} 元</td>
      </tr>
    `;
  }

  let riskText = "";
  let riskClass = "";

  if (profitRate >= 30) {
    riskText = "低風險";
    riskClass = "risk-low";
  } else if (profitRate >= 10) {
    riskText = "中風險";
    riskClass = "risk-mid";
  } else {
    riskText = "高風險";
    riskClass = "risk-high";
  }

  let advice = "";

  if (profit > 0 && profitRate >= 30) {
    advice = `
      目前經營結果良好，利潤率達 ${percent(profitRate)}%。本案例最關鍵的變因是「價格」與「產量」。
      每公斤售價每增加 1 元，整體收入約增加 ${money(priceImpact)} 元。
      建議可進一步思考品牌化、契作、直銷或分批銷售，提高平均售價並降低市場波動風險。
    `;
  } else if (profit > 0) {
    advice = `
      目前仍有獲利，但利潤安全距離不高。若遇到價格下跌或產量減少，獲利可能明顯縮水。
      建議檢視成本結構，並思考提高單價、分散通路或加工加值。
    `;
  } else {
    advice = `
      目前推算結果顯示有虧損風險。建議優先檢查成本是否過高、售價是否偏低，或產量是否不足。
      可嘗試提高售價、增加產量、降低成本，再重新模擬一次。
    `;
  }

  result.innerHTML = `
    <div class="simulation-report">
      <h3>📊 AI推演分析報告</h3>
      <p class="report-subtitle">
        AI已根據您輸入的售價、產量與成本，自動推演可能的收益、風險與經營建議。
      </p>

      <div class="result-grid">
        <div class="result-card">
          <span>💰 預估收入</span>
          <strong>${money(income)} 元</strong>
        </div>
        <div class="result-card">
          <span>💸 總成本</span>
          <strong>${money(cost)} 元</strong>
        </div>
        <div class="result-card">
          <span>🌱 預估獲利</span>
          <strong>${money(profit)} 元</strong>
        </div>
        <div class="result-card">
          <span>📈 利潤率</span>
          <strong>${percent(profitRate)}%</strong>
        </div>
        <div class="result-card">
          <span>⚖️ 損益平衡價格</span>
          <strong>${balancePrice.toFixed(2)} 元/kg</strong>
        </div>
        <div class="result-card">
          <span>🛡️ 價格安全空間</span>
          <strong>${safeSpace.toFixed(2)} 元/kg</strong>
        </div>
      </div>

      <div class="risk-badge ${riskClass}">
        經營風險：${riskText}
      </div>

      <div class="analysis-section">
        <h4>② 價格敏感度分析</h4>
        <p>以目前售價 ${price} 元為中心，自動推算價格變動後的結果。</p>

        <div class="table-wrap">
          <table class="analysis-table">
            <thead>
              <tr>
                <th>每公斤售價</th>
                <th>預估收入</th>
                <th>預估獲利</th>
              </tr>
            </thead>
            <tbody>
              ${rowPrice(Math.max(price - 2, 0), `${Math.max(price - 2, 0).toFixed(1)} 元`)}
              ${rowPrice(Math.max(price - 1, 0), `${Math.max(price - 1, 0).toFixed(1)} 元`)}
              ${rowPrice(price, `目前 ${price.toFixed(1)} 元`)}
              ${rowPrice(price + 1, `${(price + 1).toFixed(1)} 元`)}
              ${rowPrice(price + 2, `${(price + 2).toFixed(1)} 元`)}
            </tbody>
          </table>
        </div>

        <div class="insight-box">
          💡 價格每增加 1 元，總收入約增加 <strong>${money(priceImpact)} 元</strong>。
        </div>
      </div>

      <div class="analysis-section">
        <h4>③ 產量風險分析</h4>
        <p>AI自動推算減產與增產情境，協助學生理解氣候、病蟲害與管理技術對收益的影響。</p>

        <div class="table-wrap">
          <table class="analysis-table">
            <thead>
              <tr>
                <th>情境</th>
                <th>產量</th>
                <th>預估收入</th>
                <th>預估獲利</th>
              </tr>
            </thead>
            <tbody>
              ${rowYield(0.8, "減產 20%")}
              ${rowYield(0.9, "減產 10%")}
              ${rowYield(1, "目前產量")}
              ${rowYield(1.1, "增產 10%")}
              ${rowYield(1.2, "增產 20%")}
            </tbody>
          </table>
        </div>

        <div class="insight-box">
          🌪️ 若減產 20%，預估獲利將變為 
          <strong>${money(price * yieldKg * 0.8 - cost)} 元</strong>。
        </div>
      </div>

      <div class="analysis-section">
        <h4>④ 損益平衡點</h4>
        <p>
          本案例的損益平衡價格為 
          <strong>${balancePrice.toFixed(2)} 元/kg</strong>。
          只要售價低於這個價格，就可能進入虧損。
        </p>
      </div>

      <div class="ai-advice-box">
        <h4>🤖 AI經營建議</h4>
        <p>${advice}</p>
      </div>

      <div class="tip-box">
        📚 教學思考：請學生觀察「價格變動」與「產量變動」哪一項對獲利影響更大，並討論農民可以如何降低風險。
      </div>
    </div>
  `;
}

function clearCalculator() {
  document.getElementById("priceInput").value = "";
  document.getElementById("yieldInput").value = "";
  document.getElementById("costInput").value = "";
  document.getElementById("result").innerHTML = "請輸入資料後按下「開始分析」。";
}