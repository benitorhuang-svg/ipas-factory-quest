window.FactoryGuideNotes = icon => `
<article class="guide-card">
          <div class="guide-trap-header">${icon('cross')} SPC 管制界限 (UCL/LCL) 與工程規格界限 (USL/LSL) 的混淆</div>
          <div class="trap-wrong">❌ 常見誘答：管制界限是由客戶設計圖面或工程規範決定</div>
          <div class="trap-right">✔ 正確解答：規格界限由設計圖決定；管制界限完全依製程統計數據算得 (μ ± 3σ)</div>
          <p class="muted">管制圖「不能」把客戶規格界限直接畫在上面當作管制線；製程穩定並不保證產品符合規格界限。</p>
        </article>
<article class="guide-card">
          <div class="guide-trap-header">${icon('cross')} MRP 淨需求推算中，「排定收貨」是否等於安全庫存？</div>
          <div class="trap-wrong">❌ 常見誘答：把安全庫存當作已到貨供給直接扣抵</div>
          <div class="trap-right">✔ 正確解答：安全庫存是期末保留量；排定收貨是已下達未結清之採購或製令</div>
          <p class="muted">淨需求 = max(0, 毛需求 + 目標安全庫存 - 期初可用庫存 - 排定收貨)。需求日之後才到的物料不能扣抵當期需求。</p>
        </article>
<article class="guide-card">
          <div class="guide-trap-header">${icon('cross')} 工業物聯網 MQTT 協定與 Modbus 的架構區別</div>
          <div class="trap-wrong">❌ 常見誘答：MQTT 是主從輪詢架構；Modbus 是發布/訂閱</div>
          <div class="trap-right">✔ 正確解答：Modbus 採主從輪詢 (Master/Slave / Client/Server)；MQTT 採 Broker 發布/訂閱架構</div>
          <p class="muted">Modbus 沒有內建語意模型且無法主動推送事件；MQTT 適合低頻寬不穩定網路事件通知；OPC UA 則提供完整物件語意資訊模型。</p>
        </article>
`;
