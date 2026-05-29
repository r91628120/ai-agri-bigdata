// ===============================
// 📊 價格趨勢圖：愛文芒果示範資料
// ===============================

const priceChartCanvas = document.getElementById("priceChart");

if (priceChartCanvas && typeof Chart !== "undefined") {
  new Chart(priceChartCanvas, {
    type: "line",
    data: {
      labels: ["第1週", "第2週", "第3週", "第4週", "第5週", "第6週", "第7週"],
      datasets: [{
        label: "愛文芒果價格（元/公斤）",
        data: [55, 58, 60, 59, 63, 67, 68],
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

  result.innerHTML = `
    <h3>📊 經營分析結果</h3>
    <p>💰 預估收入：<strong>${income.toLocaleString()} 元</strong></p>
    <p>💸 總成本：<strong>${cost.toLocaleString()} 元</strong></p>
    <p>🌱 預估毛利：<strong>${profit.toLocaleString()} 元</strong></p>
    <p>📈 損益平衡價格：<strong>${balancePrice.toFixed(1)} 元/公斤</strong></p>
    <p>📊 毛利率：<strong>${profitRate.toFixed(1)}%</strong></p>
  `;
}

function clearCalculator() {
  document.getElementById("priceInput").value = "";
  document.getElementById("yieldInput").value = "";
  document.getElementById("costInput").value = "";
  document.getElementById("result").innerHTML = "請輸入資料後按下「開始分析」。";
}