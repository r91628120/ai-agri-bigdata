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

    chartTitle.innerHTML = `${crop} 近${selectedPeriod}天價格與交易量分析`;

    status.innerHTML =
      `已完成近 ${trendData.length} 日「${crop}」市場分析。`;

    analysisText.innerHTML = `
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