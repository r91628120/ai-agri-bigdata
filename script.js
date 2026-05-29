// ===============================
// 📊 價格趨勢圖：愛文芒果示範資料
// ===============================

const priceChartCanvas = document.getElementById("priceChart");

if (priceChartCanvas) {
  new Chart(priceChartCanvas, {
    type: "line",
    data: {
      labels: [
        "第1週",
        "第2週",
        "第3週",
        "第4週",
        "第5週",
        "第6週",
        "第7週"
      ],
      datasets: [
        {
          label: "愛文芒果價格（元/公斤）",
          data: [55, 58, 60, 59, 63, 67, 68],
          borderWidth: 3,
          tension: 0.35,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          enabled: true
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: "價格（元/公斤）"
          }
        },
        x: {
          title: {
            display: true,
            text: "時間"
          }
        }
      }
    }
  });
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

  let profitMessage = "";

  if (profit > 0) {
    profitMessage = "✅ 此次模擬結果為獲利狀態，可進一步討論如何提高品質、品牌價值與銷售價格。";
  } else if (profit === 0) {
    profitMessage = "⚠️ 此次模擬結果剛好達到損益平衡，需注意天氣、人工與運輸成本變化。";
  } else {
    profitMessage = "❌ 此次模擬結果為虧損狀態，建議重新檢視成本、產量或銷售價格。";
  }

  result.innerHTML = `
    <h3>📊 經營分析結果</h3>

    <p>💰 預估收入：<strong>${income.toLocaleString()} 元</strong></p>

    <p>💸 總成本：<strong>${cost.toLocaleString()} 元</strong></p>

    <p>🌱 預估毛利：<strong>${profit.toLocaleString()} 元</strong></p>

    <p>📈 損益平衡價格：<strong>${balancePrice.toFixed(1)} 元/公斤</strong></p>

    <p>📊 毛利率：<strong>${profitRate.toFixed(1)}%</strong></p>

    <hr>

    <p>${profitMessage}</p>
  `;
}


// ===============================
// 🧭 導覽列滑動後陰影效果
// ===============================

window.addEventListener("scroll", () => {
  const header = document.querySelector(".site-header");

  if (!header) return;

  if (window.scrollY > 20) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});


// ===============================
// 📅 頁尾自動年份
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const footer = document.querySelector(".footer");

  if (!footer) return;

  footer.innerHTML += `
    <p>© ${new Date().getFullYear()} AI Agri Big Data Education Platform</p>
  `;
});