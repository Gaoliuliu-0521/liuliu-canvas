/* Windows 按用户要求固定为本机已安装的 V4.0；Mac 读取最新正式版。 */
(() => {
  const repository = 'Gaoliuliu-0521/liuliu-canvas';
  const endpoint = 'https://api.github.com/repos/' + repository + '/releases/latest';
  const releaseBase = 'https://github.com/' + repository + '/releases/';
  const patterns = {
    macos: /^liuliu-canvas_\d+\.\d+\.\d+_aarch64\.dmg$/,
    'macos-intel': /^liuliu-canvas_\d+\.\d+\.\d+_x64\.dmg$/,
  };
  const status = document.getElementById('release-status');
  const label = document.getElementById('release-label');
  const notes = document.getElementById('release-notes');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const fallback = () => { status.textContent = 'Windows 为 V4.0，Mac 为 V4.5。暂时无法读取 Mac 最新版本，仍可直接下载。'; };
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
      const version = release.tag_name.slice(1).replace(/\.0$/, '');
      for (const { platform, asset } of downloads) {
        document.querySelector('[data-download="' + platform + '"]').href = asset.browser_download_url;
        document.querySelector('[data-size="' + platform + '"]').textContent = (asset.size / (1024 * 1024)).toFixed(1) + ' MB';
        document.querySelector('[data-version="' + platform + '"]').textContent = 'V' + version;
      }
      label.textContent = 'Windows V4.0 · Mac V' + version;
      notes.href = release.html_url;
      status.textContent = 'Windows 提供本机已安装版对应的 V4.0 原安装包；Mac 提供 V' + version + '。';
    })
    .catch(fallback)
    .finally(() => clearTimeout(timeout));
})();
