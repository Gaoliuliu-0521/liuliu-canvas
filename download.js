/* 下载固定为当前已安装用户版 V4.0，不自动切换其他版本。 */
(() => {
  const status = document.getElementById('release-status');
  if (status) status.textContent = '仅提供与当前已安装用户版一致的 V4.0 原安装包。';
})();
