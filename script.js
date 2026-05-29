let priceChartInstance = null;

function renderPriceChart(labels, prices, cropName) {
  const canvas = document.getElementById("priceChart");
  if (!canvas || typeof Chart === "undefined") return;

  if (priceChartInstance) {
    priceChartInstance.destroy();
  }

  priceChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: `${cropName} 平均價（元/公斤）`,
        data: prices,
        borderWidth: 3,
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
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

  const apiUrl = new URL("https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx");
  apiUrl.searchParams.set("$top", "200");
  apiUrl.searchParams.set("Crop", crop);

  if (market) {
    apiUrl.searchParams.set("Market", market);
  }

  try {
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

  const apiUrl = new URL("https://data.moa.gov.tw/Service/OpenData/FromM/FarmTransData.aspx");
  apiUrl.searchParams.set("$top", "300");
  apiUrl.searchParams.set("Crop", crop);

  if (market) {
    apiUrl.searchParams.set("Market", market);
  }

  try {
    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    const filteredData = data.filter(item => {
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

    const trendData = Object.keys(dailyMap)
      .sort()
      .map(date => ({
        date,
        avgPrice: dailyMap[date].totalPrice / dailyMap[date].count,
        quantity: dailyMap[date].totalQuantity
      }));

    if (trendData.length < 2) {
      status.innerHTML = `「${crop}」資料筆數不足，暫時無法形成趨勢圖。`;
      return;
    }

    const labels = trendData.map(item => item.date);
    const prices = trendData.map(item => Number(item.avgPrice.toFixed(1)));

    renderPriceChart(labels, prices, crop);

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

    chartTitle.innerHTML = `${crop} 近期價格趨勢`;
    status.innerHTML = `已完成 ${trendData.length} 日「${crop}」趨勢分析。`;

    aiText.innerHTML = `
      <p><strong>${trendIcon} 市場趨勢：</strong>${trendText}</p>
      <ul>
        <li>起始平均價：${firstPrice.toFixed(1)} 元/公斤</li>
        <li>最新平均價：${lastPrice.toFixed(1)} 元/公斤</li>
        <li>價格變化：${change.toFixed(1)} 元，約 ${changeRate.toFixed(1)}%</li>
        <li>交易量變化：約 ${quantityChangeRate.toFixed(1)}%</li>
      </ul>
      <hr>
      <p><strong>🎓 教學重點：</strong></p>
      <p>
        可引導學生觀察「價格」與「交易量」是否同時變化。
        若價格上升但交易量下降，可能代表供應減少；
        若價格下降但交易量增加，可能代表大量上市造成價格壓力。
      </p>
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
  const balancePrice = cost / yieldKg;
  const profitRate = (profit / income) * 100;

   let advice = "";
let icon = "";

if (profit > 0) {

  icon = "🟢";

  if (profitRate >= 30) {
    advice = `
      <strong>獲利狀況良好</strong><br>
      目前毛利率達 ${profitRate.toFixed(1)}%，
      已具有不錯的經營效益。<br>
      若市場價格穩定，可考慮擴大種植面積或增加產量。
    `;
  } else {
    advice = `
      <strong>有獲利，但仍需注意成本控制</strong><br>
      雖然目前為正毛利，
      但若遇到價格下跌或產量減少，
      獲利可能快速縮水。
    `;
  }

} else if (profit === 0) {

  icon = "🟡";

  advice = `
    <strong>損益平衡</strong><br>
    目前收入剛好等於成本，
    幾乎沒有實際獲利空間。
  `;

} else {

  icon = "🔴";

  advice = `
    <strong>虧損風險</strong><br>
    目前售價或產量不足以支撐成本，
    建議提高售價、增加產量，
    或重新檢視成本結構。
  `;
}

let riskText = "";
let riskColor = "";

if (profitRate >= 30) {
  riskText = "低風險";
  riskColor = "#1f9d55";
}
else if (profitRate >= 10) {
  riskText = "中風險";
  riskColor = "#f59e0b";
}
else {
  riskText = "高風險";
  riskColor = "#dc2626";
}

<p>
⚠️ 經營風險：
<strong style="color:${riskColor}">
${riskText}
</strong>
</p>



  rresult.innerHTML = `
  <h3>📊 經營分析結果</h3>

  <p>💰 預估收入：<strong>${income.toLocaleString()} 元</strong></p>

  <p>💸 總成本：<strong>${cost.toLocaleString()} 元</strong></p>

  <p>🌱 預估毛利：<strong>${profit.toLocaleString()} 元</strong></p>

  <p>📈 損益平衡價格：<strong>${balancePrice.toFixed(1)} 元/公斤</strong></p>

  <p>📊 毛利率：<strong>${profitRate.toFixed(1)}%</strong></p>

  <hr>

  <div class="ai-advice-box">
      <h4>${icon} AI經營判讀</h4>
      <p>${advice}</p>
  </div>

  <div class="tip-box">
      📚 教學思考：<br>
      如果市場價格下降10元，
      是否仍然能獲利？<br>
      試著重新輸入售價觀察變化。
  </div>
 `;
}

function clearCalculator() {
  document.getElementById("priceInput").value = "";
  document.getElementById("yieldInput").value = "";
  document.getElementById("costInput").value = "";
  document.getElementById("result").innerHTML = "請輸入資料後按下「開始分析」。";
}