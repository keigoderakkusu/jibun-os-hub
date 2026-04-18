// ============================================================
//  自分株式会社 Chrome拡張  popup.js  v2.0
//  タブUI: 生成 / ジョブ管理 / テンプレ管理 / 設定
// ============================================================

let CFG = { serverUrl: "", chatId: "" };

document.addEventListener("DOMContentLoaded", async () => {

  // ── 設定読み込み ──
  await loadConfig();

  // ── タブ切り替え ──
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab, .panel").forEach(el => el.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
      if (tab.dataset.tab === "templates") loadTemplateList();
    });
  });

  // ── スケジュールチェックボックス ──
  document.getElementById("use-schedule").addEventListener("change", (e) => {
    document.getElementById("schedule-area").style.display = e.target.checked ? "block" : "none";
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  生成パネル
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  document.getElementById("generate-btn").addEventListener("click", async () => {
    const keyword  = document.getElementById("keyword").value.trim();
    const template = document.getElementById("template-select").value;
    const status   = document.getElementById("post-status").value;
    const useSchedule = document.getElementById("use-schedule").checked;
    const scheduleDt  = document.getElementById("schedule-dt").value;

    if (!CFG.serverUrl) { showResult("result", "❌ 設定タブでサーバーURLを入力してください", "error"); return; }
    if (!keyword)       { showResult("result", "❌ キーワードを入力してください", "error"); return; }
    if (useSchedule && !scheduleDt) { showResult("result", "❌ スケジュール日時を選択してください", "error"); return; }

    const btn = document.getElementById("generate-btn");
    btn.disabled = true;
    btn.textContent = "⏳ 送信中...";
    showResult("result", "サーバーに生成リクエストを送信中...", "info");

    try {
      let res, data;
      if (useSchedule) {
        // スケジュール投稿
        res  = await apiFetch("/schedule", {
          keyword, template,
          scheduledAt: new Date(scheduleDt).toISOString(),
          chatId: CFG.chatId,
        });
        data = await res.json();
        showResult("result",
          data.ok
            ? `✅ スケジュール登録完了！\nジョブID: ${data.jobId}\n⏰ ${scheduleDt}`
            : `❌ エラー: ${data.error}`,
          data.ok ? "success" : "error"
        );
      } else if (status === "publish") {
        // 即公開（承認スキップ）
        res  = await apiFetch("/generate", { keyword, template, autoPublish: true });
        data = await res.json();
        showResult("result",
          data.ok
            ? `✅ 公開完了！\n📄 ${data.title}\n🔗 ${data.link || "（確認中）"}`
            : `❌ エラー: ${data.error}`,
          data.ok ? "success" : "error"
        );
      } else {
        // 承認フロー
        res  = await apiFetch("/generate", { keyword, template, chatId: CFG.chatId });
        data = await res.json();
        showResult("result",
          data.ok
            ? `✅ 生成リクエスト送信！\nジョブID: ${data.jobId}\nTelegramに通知が届きます。`
            : `❌ エラー: ${data.error}`,
          data.ok ? "success" : "error"
        );
      }
    } catch (e) {
      showResult("result", "❌ 通信エラー: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "🚀 記事を生成する";
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ジョブパネル
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  document.getElementById("refresh-jobs-btn").addEventListener("click", loadJobs);

  async function loadJobs() {
    const list = document.getElementById("jobs-list");
    list.innerHTML = '<p class="hint">読み込み中...</p>';
    try {
      const res   = await apiFetch("/jobs", null, "GET");
      const jobs  = await res.json();
      if (!jobs.length) { list.innerHTML = '<p class="hint">ジョブはありません</p>'; return; }
      list.innerHTML = jobs.slice(0, 12).map(j => `
        <div class="job-card">
          <div class="job-card-header">
            <span class="job-card-id">${j.id}</span>
            <span class="badge ${j.status}">${j.status}</span>
          </div>
          <div class="job-card-title">${j.title || j.keyword}（${j.template}）</div>
          ${j.status === "pending" ? `
          <div class="job-actions">
            <button class="btn-sm" onclick="jobAction('${j.id}','approve')">公開</button>
            <button class="btn-sm" onclick="jobAction('${j.id}','draft')">下書き</button>
            <button class="btn-sm btn-danger-sm" onclick="jobAction('${j.id}','reject')">破棄</button>
          </div>` : ""}
        </div>`).join("");
    } catch (e) {
      list.innerHTML = `<p class="hint" style="color:#a02">❌ ${e.message}</p>`;
    }
  }

  window.jobAction = async (id, action) => {
    try {
      const res  = await apiFetch(`/jobs/${id}/${action}`, {}, "POST");
      const data = await res.json();
      if (data.ok) loadJobs();
      else alert("エラー: " + data.error);
    } catch (e) { alert("通信エラー: " + e.message); }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  テンプレパネル
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async function loadTemplateList() {
    const list = document.getElementById("templates-list");
    try {
      const res  = await apiFetch("/templates", null, "GET");
      const data = await res.json();
      list.innerHTML = data.map(t => `
        <div class="tmpl-card">
          <div class="tmpl-card-info">
            <div class="tmpl-card-name">${t.name}</div>
            <div class="tmpl-card-persona">${t.persona} / ${t.tone}</div>
          </div>
          ${t.name !== "default" ? `<button class="btn-sm btn-danger-sm" onclick="deleteTemplate('${t.name}')">削除</button>` : ""}
        </div>`).join("");
      // テンプレート選択肢も更新
      const sel = document.getElementById("template-select");
      sel.innerHTML = data.map(t => `<option value="${t.name}">${t.name} — ${t.persona}</option>`).join("");
    } catch (e) {
      list.innerHTML = `<p class="hint" style="color:#a02">❌ ${e.message}</p>`;
    }
  }

  document.getElementById("add-tmpl-btn").addEventListener("click", async () => {
    const name    = document.getElementById("new-tmpl-name").value.trim();
    const persona = document.getElementById("new-tmpl-persona").value.trim();
    const tone    = document.getElementById("new-tmpl-tone").value.trim() || "丁寧でわかりやすい";
    const wordCount = document.getElementById("new-tmpl-wc").value.trim() || "1500〜2000";
    if (!name || !persona) { showResult("tmpl-result", "❌ 名前とペルソナは必須です", "error"); return; }
    try {
      const res  = await apiFetch("/templates", { name, persona, tone, wordCount });
      const data = await res.json();
      if (data.ok) {
        showResult("tmpl-result", `✅ テンプレート「${name}」を保存しました`, "success");
        ["new-tmpl-name","new-tmpl-persona","new-tmpl-tone","new-tmpl-wc"].forEach(id => document.getElementById(id).value = "");
        loadTemplateList();
      } else {
        showResult("tmpl-result", "❌ " + data.error, "error");
      }
    } catch (e) { showResult("tmpl-result", "❌ " + e.message, "error"); }
  });

  window.deleteTemplate = async (name) => {
    if (!confirm(`テンプレート「${name}」を削除しますか？`)) return;
    try {
      const res = await fetch(`${CFG.serverUrl}/templates/${name}`, { method: "DELETE" });
      const d   = await res.json();
      if (d.ok) loadTemplateList();
    } catch (e) { alert("エラー: " + e.message); }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  設定パネル
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  document.getElementById("save-settings-btn").addEventListener("click", async () => {
    const url    = document.getElementById("server-url").value.trim();
    const chatId = document.getElementById("tg-chat-id").value.trim();
    if (!url) { showResult("settings-result", "❌ サーバーURLは必須です", "error"); return; }
    CFG = { serverUrl: url, chatId };
    chrome.storage.local.set(CFG);
    showResult("settings-result", "✅ 設定を保存しました", "success");
  });

  document.getElementById("test-conn-btn").addEventListener("click", async () => {
    const url = document.getElementById("server-url").value.trim();
    if (!url) { showResult("settings-result", "❌ URLを入力してください", "error"); return; }
    try {
      const res  = await fetch(`${url}/health`);
      const data = await res.json();
      showResult("settings-result",
        data.ok ? `✅ 接続OK！ジョブ: ${data.jobs}件 / テンプレ: ${data.templates}件` : "❌ 応答異常",
        data.ok ? "success" : "error"
      );
    } catch (e) { showResult("settings-result", "❌ 接続失敗: " + e.message, "error"); }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ユーティリティ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async function loadConfig() {
    return new Promise(resolve => {
      chrome.storage.local.get(["serverUrl", "chatId"], (data) => {
        CFG = { serverUrl: data.serverUrl || "", chatId: data.chatId || "" };
        if (data.serverUrl) document.getElementById("server-url").value = data.serverUrl;
        if (data.chatId)    document.getElementById("tg-chat-id").value = data.chatId;
        resolve();
      });
    });
  }

  function apiFetch(path, body = null, method = "POST") {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body && method !== "GET") opts.body = JSON.stringify(body);
    return fetch(CFG.serverUrl + path, opts);
  }

  function showResult(elId, msg, type = "info") {
    const el = document.getElementById(elId);
    el.textContent = msg;
    el.className = "result " + type;
    el.style.display = "block";
  }
});
