import fs from 'fs';
import path from 'path';
import os from 'os';
import { shell } from 'electron';
import { app } from '@electron/remote';
import { execSync } from 'child_process';

const filePath = path.resolve(
  'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs'
);

const appData = path.join(os.homedir(), './AppData/Roaming');

const startMenu = path.join(
  appData,
  'Microsoft\\Windows\\Start Menu\\Programs'
);

const fileLists: any = [];
const isZhRegex = /[\u4e00-\u9fa5]/;

const icondir = path.join(os.tmpdir(), 'ProcessIcon');
const exists = fs.existsSync(icondir);
if (!exists) {
  fs.mkdirSync(icondir);
}

const getico = (appInfo) => {
  const iconpath = path.join(icondir, `${appInfo.name}.png`);
  fs.exists(iconpath, (exists) => {
    if (exists) {
      // console.log('[Icon Debug] icon already exists:', iconpath);
      return;
    }

    // console.log('[Icon Debug] getico start for:', appInfo.name, appInfo.desc);
    app.getFileIcon(appInfo.desc, { size: 'large' }).then(nativeImage => {
      try {
        const buffer = nativeImage.toPNG();
        // console.log('[Icon Debug] icon extracted, buffer length:', buffer ? buffer.length : 'null');
        fs.writeFile(iconpath, buffer, (err) => {
          if (err) {
            // console.error('[Icon Debug] fs.writeFile error:', err);
          } else {
            // console.log('[Icon Debug] icon written successfully:', iconpath);
          }
        });
      } catch (e) {
        // console.error('[Icon Debug] buffer conversion error:', e);
      }
    }).catch(err => {
      // console.error('[Icon Debug] app.getFileIcon error:', err, appInfo.desc);
    });
  });
};

function fileDisplay(filePath) {
  //根据文件路径读取文件，返回文件列表
  fs.readdir(filePath, function (err, files) {
    if (err) {
      console.warn(err);
    } else {
      // console.log('[Search Debug] Scanning dir:', filePath, 'Files:', files.length); // Optional verbose log
      files.forEach(function (filename) {
        const filedir = path.join(filePath, filename);
        fs.stat(filedir, function (eror, stats) {
          if (eror) {
            console.warn('获取文件stats失败');
          } else {
            const isFile = stats.isFile(); // 是文件
            const isDir = stats.isDirectory(); // 是文件夹
            if (isFile) {
              // Skip desktop.ini and other non-relevant files
              if (filename.toLowerCase() === 'desktop.ini') return;

              const ext = path.extname(filename).toLowerCase();
              if (ext !== '.lnk' && ext !== '.url' && ext !== '.exe') return;

              const appName = filename.replace(ext, '');
              const keyWords = [appName];
              let appDetail: any = {};

              if (ext === '.lnk' || ext === '.url') {
                try {
                  appDetail = shell.readShortcutLink(filedir);
                } catch (e) {
                  // console.warn('[Search Debug] readShortcutLink failed for:', filename, e);
                  // Fallback: use PowerShell to resolve shortcut
                  try {
                    // Safe quoting for PowerShell, escaping single quotes
                    const safePath = filedir.replace(/'/g, "''");
                    const psCmd = `powershell -NoProfile -Command "$sh=New-Object -ComObject WScript.Shell;$s=$sh.CreateShortcut('${safePath}');$s.TargetPath"`;
                    const target = execSync(psCmd, { encoding: 'utf8' }).trim();
                    if (target) {
                      // console.log('[Search Debug] Fallback resolution success for:', filename, 'Target:', target);
                      appDetail = {
                        target: target,
                        args: '',
                        description: '',
                        cwd: '',
                        appUserModelId: '',
                      };
                    }
                  } catch (fallbackErr) {
                    // console.warn('[Search Debug] Fallback also failed for:', filename);
                  }
                }
              } else if (ext === '.exe') {
                // For .exe files directly in the folder
                appDetail = { target: filedir };
              }

              // Filter out common uninstaller executables
              // Generic logic: Only filter if the filename STARTS with 'uninstall' or 'uninst'
              // This avoids false positives for apps like 'Bulk Crap Uninstaller' or 'Revo Uninstaller'
              const targetBase = path.basename(appDetail.target).toLowerCase();
              if (
                !appDetail.target ||
                targetBase.startsWith('uninstall') ||
                targetBase.startsWith('uninst')
              ) {
                return;
              }

              // C:/program/cmd.exe => cmd
              keyWords.push(path.basename(appDetail.target, '.exe'));

              if (isZhRegex.test(appName)) {
                // const [, pinyinArr] = translate(appName);
                // const zh_firstLatter = pinyinArr.map((py) => py[0]);
                // // 拼音
                // keyWords.push(pinyinArr.join(''));
                // 缩写
                // keyWords.push(zh_firstLatter.join(''));
              } else {
                const firstLatter = appName
                  .split(' ')
                  .map((name) => name[0])
                  .join('');
                keyWords.push(firstLatter);
              }

              const icon = path.join(
                os.tmpdir(),
                'ProcessIcon',
                `${encodeURIComponent(appName)}.png`
              );

              const appInfo = {
                value: 'plugin',
                desc: appDetail.target,
                type: 'app',
                icon,
                pluginType: 'app',
                action: `start "dummyclient" "${appDetail.target}"`,
                keyWords: keyWords,
                name: appName,
                names: JSON.parse(JSON.stringify(keyWords)),
              };
              // console.log('[Search Debug] Adding app:', appName);
              fileLists.push(appInfo);
              getico(appInfo);
            }
            if (isDir) {
              fileDisplay(filedir); // 递归，如果是文件夹，就继续遍历该文件夹下面的文件
            }
          }
        });
      });
    }
  });
}

export default () => {
  fileDisplay(filePath);
  fileDisplay(startMenu);
  return fileLists;
};
