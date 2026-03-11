// 在 loadAll 前添加调试
async function loadAll() {
  console.log('[DEBUG] loadAll START, electronAPI:', !!electronAPI);
  if(!electronAPI) {
    console.log('[DEBUG] No electronAPI, rendering empty');
    renderCurrentIndicator();
    renderProviderList();
    return;
  }
  try {
    console.log('[DEBUG] Calling model-full-status...');
    const s = await electronAPI.invoke('model-full-status');
    console.log('[DEBUG] Got result:', s);
    if(!s){
      console.log('[DEBUG] No status data');
      renderCurrentIndicator();
      renderProviderList();
      return;
    }
    allModels=s.models||[]; allProviders=s.providers||[]; currentModel=s.current;
    console.log('[DEBUG] Loaded:', allProviders.length, 'providers,', allModels.length, 'models');
    renderCurrentIndicator(); renderProviderList();
  } catch (err) {
    console.error('[DEBUG] loadAll failed:', err);
    showToast(`主进程通信失败: ${err?.message || err}`,'error');
    renderCurrentIndicator();
    renderProviderList();
  }
}

function renderProviderList() {
  console.log('[DEBUG] renderProviderList, count:', allProviders.length);
  const el=document.getElementById('providerList');
  console.log('[DEBUG] providerList element:', !!el);
  if(allProviders.length===0){
    console.log('[DEBUG] Showing empty state');
    el.innerHTML='<div class="empty-state"><div class="empty-icon">+</div><div class="empty-text">暂无服务商</div><div class="empty-hint">点击 + 添加</div></div>';
    return;
  }
  console.log('[DEBUG] Rendering', allProviders.length, 'providers');
  el.innerHTML = allProviders.map(p => `<div>${p.name}</div>`).join('');
}
