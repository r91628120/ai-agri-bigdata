let selectedPeriod = 7;
let chartInstance = null;

function setPeriod(days) {
  selectedPeriod = days;

  document.querySelectorAll(".period-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  document.getElementById(`period${days}`).classList.add("active");
}

function formatRocDate(date) {
  const rocYear = date.getFullYear() - 1911;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${rocYear}.${month}.${day}`;
}

async function analyzeMarket() {
  const crop = document.getElementById("cropInput").value.trim();
  const market = document.getElementById("marketInput").value.trim();
  const status = document.getElementById("status");
  const analysisText = document.getElementById("analysisText");
  const chartTitle = document.getElementById("chartTitle");

  status.innerHTML = "資料分析中，請稍候...";
  analysisText.innerHTML = "正在讀取農產品行情資料...";

  if (!crop) {
    status.innerHTML = "⚠️ 請先輸入作物名稱，例如：苦瓜、甘藍、芒果-愛文。";
    return;
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (selectedPeriod - 1));

  let allData = [];

  try {
    for (let skip = 0; skip < 5000; skip += 500) {
      const apiUrl = new URL("https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx");

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
      status.innerHTML = `查無「${crop}」資料，請改用完整作物名稱，例如：芒果-愛文。`;
      analysisText.innerHTML = "尚無可分析資料。";
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

    const trendData = Object.keys(dailyMap)
      .sort()
      .map(date => ({
        date,
        avgPrice: dailyMap[date].totalPrice / dailyMap[date].count,
        quantity: dailyMap[date].totalQuantity
      }));

    if (trendData.length < 2) {
      status.innerHTML = `目前僅取得 ${trendData.length} 日資料，暫時無法形成趨勢分析。`;
      return;
    }

    const labels = trendData.map(item => item.date);
    const prices = trendData.map(item => Number(item.avgPrice.toFixed(1)));
    const quantities = trendData.map(item => Number(item.quantity || 0));

    renderChart(labels, prices, quantities, crop);

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

    let supplyDemandText = "";
    let supplyStatus = "";

    let farmerAdvice = "";
    let decisionSuggestion = "";

    let studentQuestion = "";

    let riskLevel = "低";
    let riskScore = 30;
    
    let priceForecast = "";
    let supplyForecast = "";
    let weatherRisk = "";



    if (changeRate > 5 && quantityChangeRate < -5) {

       supplyStatus = "供給減少 ＞ 需求穩定";

       supplyDemandText =
          "價格上升、交易量下降，代表市場供給減少，價格受到支撐。";

       farmerAdvice =
         "可觀察是否進入採收尾聲，若品質穩定，可考慮分批出貨，提高平均售價。";

       decisionSuggestion =
         "建議採取分批出貨策略。";

       studentQuestion =
         "為什麼交易量下降時，價格可能反而上升？";

        riskLevel = "中";
        riskScore = 55;
        
        riskLevel = "高";
        riskScore = 85;

        priceForecast = "未來7天價格可能偏弱，若交易量持續增加，價格仍有下探壓力。";
        supplyForecast = "目前有大量上市訊號，供給增加機率偏高。";
        weatherRisk = "尚未串接即時氣象資料，建議後續加入降雨、颱風與高溫資料判斷採收風險。";

      }
      else if (changeRate < -5 && quantityChangeRate > 5) {

        supplyStatus = "供給增加 ＞ 市場需求";

        supplyDemandText =
         "價格下降、交易量上升，可能代表大量上市造成價格壓力。";

        farmerAdvice =
          "建議評估分級銷售、加工利用或轉往其他通路。";

        decisionSuggestion =
          "避免集中出貨，可考慮加工或冷藏。";

        studentQuestion =
           "大量上市時，農民如何降低價格風險？";
       
      }
      else if (changeRate > 5 && quantityChangeRate > 5) {

        supplyStatus = "需求增加";

        supplyDemandText =
          "價格與交易量同步上升，可能代表市場需求增加。";

        farmerAdvice =
          "可觀察是否持續缺貨，提高產品附加價值。";

        decisionSuggestion =
         "適合加強品牌行銷與通路經營。";

        studentQuestion =
         "價格與交易量同步增加代表什麼？";

        riskLevel = "低";
        riskScore = 35;
      }
      else if (changeRate < -5 && quantityChangeRate < -5) {

        supplyStatus = "需求下降";

        supplyDemandText =
          "價格與交易量同步下降，市場熱度減弱。";

        farmerAdvice =
          "保守規劃出貨時程。";

        decisionSuggestion =
          "建議觀察市場後再決定是否大量出貨。";

        studentQuestion =
          "需求下降可能來自哪些原因？";

        riskLevel = "中";
        riskScore = 60;
    
        priceForecast = "未來7天價格可能維持相對支撐，若供給持續減少，價格仍可能上升。";
        supplyForecast = "供給可能偏少，需觀察是否進入採收尾聲。";
        weatherRisk = "尚未串接即時氣象資料，後續可加入天氣風險判斷。";
      }
      else {

        supplyStatus = "供需大致平衡";

        supplyDemandText =
           "市場目前處於整理階段。";

        farmerAdvice =
           "持續觀察後續行情。";

        decisionSuggestion =
           "維持正常出貨即可。";

        studentQuestion =
           "除了價格之外還有哪些市場訊號？";

        riskLevel = "低";
        riskScore = 25;
      }

     analysisText.innerHTML = `

       <div class="module-grid">

        <div class="analysis-module">
          <h3>① 市場判讀模組</h3>

           <p><strong>${trendIcon} 市場趨勢：</strong>${trendText}</p>

          <ul>
            <li>起始平均價：${firstPrice.toFixed(1)} 元/公斤</li>
            <li>最新平均價：${lastPrice.toFixed(1)} 元/公斤</li>
            <li>價格變化：${change.toFixed(1)} 元</li>
            <li>價格漲跌幅：${changeRate.toFixed(1)}%</li>
           <li>交易量變化：${quantityChangeRate.toFixed(1)}%</li>
          </ul>

       </div>

    <div class="analysis-module">
       <h3>② 供需分析模組</h3>

        <p><strong>AI供需判斷：</strong></p>

        <p>${supplyStatus}</p>

        <p>${supplyDemandText}</p>

    </div>

    <div class="analysis-module">
       <h3>③ 風險預警模組</h3>

         <p class="risk-badge">
           風險等級：${riskLevel}
         </p>

          <br><br>

         <p>
           市場風險指數：
           <strong>${riskScore}/100</strong>
         </p>

         <p>
           指數越高代表價格波動與市場風險越高。
         </p>

    </div>

    <div class="analysis-module">
      <h3>④ 農民決策模組</h3>

        <p>${farmerAdvice}</p>

         <hr>

        <p>
          <strong>AI決策建議：</strong>
           ${decisionSuggestion}
        </p>

         <div class="analysis-module">
           <h3>⑤ AI價格預測模組</h3>
             <p><strong>未來7天預測：</strong></p>
             <p>${priceForecast}</p>
         </div>

         <div class="analysis-module">
           <h3>⑥ AI供給預測模組</h3>
         <p><strong>是否可能大量上市：</strong></p>
         <p>${supplyForecast}</p>
        </div>

        <div class="analysis-module">
           <h3>⑦ 氣候風險模組</h3>
            <p><strong>氣象整合狀態：</strong></p>
            <p>${weatherRisk}</p>
        </div> 
    
        
        </div>

    <div class="analysis-module">

       <h3>🎓 教師討論區</h3>

        <p>${studentQuestion}</p>

          <ul>
           <li>如果你是農民，你會如何決策？</li>
           <li>市場價格與交易量變化代表什麼訊號？</li>
           <li>如何降低價格下跌風險？</li>
          </ul>

    </div>

    </div>
     `;

  } catch (error) {
    console.error(error);
    status.innerHTML = "資料讀取失敗，可能是 API 暫時無法連線或瀏覽器限制。";
    analysisText.innerHTML = "請稍後再試。";
  }
}

function renderChart(labels, prices, quantities, crop) {
  const canvas = document.getElementById("marketChart");

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${crop} 平均價（元/公斤）`,
          data: prices,
          borderWidth: 3,
          tension: 0.35,
          yAxisID: "y"
        },
        {
          label: `${crop} 交易量（公斤）`,
          data: quantities,
          borderWidth: 3,
          tension: 0.35,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
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
      }
    }
  });
}

function clearAnalysis() {
  document.getElementById("cropInput").value = "";
  document.getElementById("marketInput").value = "";
  document.getElementById("status").innerHTML = "尚未進行市場分析。";
  document.getElementById("chartTitle").innerHTML = "價格與交易量趨勢圖";
  document.getElementById("analysisText").innerHTML =
    "請輸入作物名稱後，系統會自動產生市場趨勢、供需判讀、農民建議與教學提問。";

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}