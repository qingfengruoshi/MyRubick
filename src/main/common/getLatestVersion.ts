// for referer policy, we can't use it in renderer
import axios from 'axios';
const RELEASE_URL = 'https://api.github.com/repos/rubickCenter/rubick/releases';

export const getLatestVersion = async (isCheckBetaUpdate = false) => {
  let res = '';
  try {
    res = await axios
      .get(RELEASE_URL, {
        headers: {
          Referer: 'https://github.com',
        },
      })
      .then((r) => {
        const list = r.data;
        if (isCheckBetaUpdate) {
          const betaList = list.filter((item) => item.name.includes('beta'));
          return betaList[0].name;
        }
        const normalList = list.filter((item) => !item.name.includes('beta'));
        return normalList[0].name;
      });
  } catch (err: any) {
    // 静默处理 GitHub API 速率限制错误
    if (err.response?.status === 403) {
      console.warn('GitHub API 速率限制，跳过版本检查');
    } else {
      console.log('版本检查失败:', err.message || err);
    }
  }
  return res;
};
