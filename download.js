/* 从公开发行仓库读取三种安装包；失败时保留已确认的 V4.5 链接。 */
(() => {
  const repository = 'Gaoliuliu-0521/liuliu-canvas';
  const endpoint = 'https://api.github.com/repos/' + repository + '/releases/latest';
  const releaseBase = 'https://github.com/' + repository + '/releases/';
  const patterns = {
    windows: /^liuliu-canvas_\d+\.\d+\.\d+_x64-setup\.exe$/,
    macos: /^liuliu-canvas_\d+\.\d+\.\d+_aarch64\.dmg$/,
    'macos-intel': /^liuliu-canvas_\d+\.\d+\.\d+_x64\.dmg$/,
  };
  const status = document.getElementById('release-status');
  const label = document.getElementById('release-label');
  const notes = document.getElementById('release-notes');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const fallback = () => { status.textContent = '当前提供 V4.5 安装包。暂时无法读取最新版本，仍可直接下载。'; };
  fetch(endpoint, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal, cache: 'no-store', credentials: 'omit' })
    .then((response) => {
      if (!response.ok) throw new Error('Release unavailable');
      return response.json();
    })
    .then((release) => {
      if (release.draft || release.prerelease || !/^v\d+\.\d+\.\d+$/.test(release.tag_name)
        || release.html_url !== releaseBase + 'tag/' + release.tag_name || !Array.isArray(release.assets)) {
        throw new Error('Unexpected release');
      }
      const downloads = Object.entries(patterns).map(([platform, pattern]) => {
        const matches = release.assets.filter((asset) => pattern.test(asset.name) && asset.state === 'uploaded');
        if (matches.length !== 1) throw new Error('Incomplete installer set');
        const asset = matches[0];
        const expectedUrl = releaseBase + 'download/' + release.tag_name + '/' + asset.name;
        if (asset.browser_download_url !== expectedUrl || !Number.isSafeInteger(asset.size) || asset.size <= 0
          || !asset.name.includes('_' + release.tag_name.slice(1) + '_')) throw new Error('Unexpected installer');
        return { platform, asset };
      });
      for (const { platform, asset } of downloads) {
        document.querySelector('[data-download="' + platform + '"]').href = asset.browser_download_url;
        document.querySelector('[data-size="' + platform + '"]').textContent = (asset.size / (1024 * 1024)).toFixed(1) + ' MB';
      }
      const version = release.tag_name.slice(1).replace(/\.0$/, '');
      label.textContent = '正式版 V' + version;
      notes.href = release.html_url;
      status.textContent = '当前正式版 V' + version + ' · 点击对应按钮即可下载安装包';
    })
    .catch(fallback)
    .finally(() => clearTimeout(timeout));
})();
